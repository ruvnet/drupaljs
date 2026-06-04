//! Recursive associative array/map diff — port of Drupal's
//! `Drupal\Component\Utility\DiffArray::diffAssoc()`, used by config diff.
//!
//! `diff_assoc(a, b)` returns the entries from `a` that are **not present** or
//! **differ** in `b`, recursing into nested maps. The PHP semantics, preserved
//! here:
//!
//! * A key in `a` but not in `b` is kept (with its full value).
//! * If both `a[k]` and `b[k]` are maps, recurse; keep `k` only if the
//!   recursive diff is non-empty, carrying just the differing sub-entries.
//! * Otherwise keep `k` iff the values are not identical (`!==` in PHP — a
//!   strict, type-aware comparison). Arrays compared against scalars (and vice
//!   versa) are never identical, so the `a` value is kept.
//!
//! This is intentionally asymmetric: `diff_assoc(a, b)` answers "what in `a`
//! would I have to change in `b`", which is exactly what config-diff display
//! needs (old vs new).

use std::collections::BTreeMap;

/// A config-like value: ordered map, list, or scalar leaf. Ordered (`BTreeMap`)
/// keys give deterministic output, matching YAML config-diff expectations.
#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Null,
    Bool(bool),
    /// Numeric and string scalars are kept distinct so `1` (Int) and `"1"`
    /// (Str) are not identical — mirroring PHP `!==`.
    Int(i64),
    Float(f64),
    Str(String),
    List(Vec<Value>),
    Map(BTreeMap<String, Value>),
}

impl Value {
    fn is_map(&self) -> bool {
        matches!(self, Value::Map(_))
    }
}

/// Strict, type-aware identity comparison, modelling PHP `!==`/`===`.
///
/// `NaN` is treated as non-identical to itself (consistent with PHP, where two
/// NaNs are never `===`), so a NaN entry always shows up as a difference.
fn identical(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Null, Value::Null) => true,
        (Value::Bool(x), Value::Bool(y)) => x == y,
        (Value::Int(x), Value::Int(y)) => x == y,
        (Value::Float(x), Value::Float(y)) => x == y, // NaN != NaN by IEEE
        (Value::Str(x), Value::Str(y)) => x == y,
        (Value::List(x), Value::List(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| identical(p, q))
        }
        (Value::Map(x), Value::Map(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).map(|w| identical(v, w)).unwrap_or(false))
        }
        _ => false, // differing variants are never identical
    }
}

/// Recursively compute the associative diff `a \ b` (Drupal `diffAssoc`).
///
/// Returns a map of the entries in `a` that are absent from or differ in `b`.
pub fn diff_assoc(a: &BTreeMap<String, Value>, b: &BTreeMap<String, Value>) -> BTreeMap<String, Value> {
    let mut out: BTreeMap<String, Value> = BTreeMap::new();
    for (key, av) in a {
        match b.get(key) {
            None => {
                // Present in a, absent in b: keep entirely.
                out.insert(key.clone(), av.clone());
            }
            Some(bv) => {
                if av.is_map() && bv.is_map() {
                    if let (Value::Map(am), Value::Map(bm)) = (av, bv) {
                        let sub = diff_assoc(am, bm);
                        if !sub.is_empty() {
                            out.insert(key.clone(), Value::Map(sub));
                        }
                    }
                } else if !identical(av, bv) {
                    out.insert(key.clone(), av.clone());
                }
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn map(pairs: Vec<(&str, Value)>) -> BTreeMap<String, Value> {
        pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect()
    }

    #[test]
    fn empty_against_empty_is_empty() {
        let a = BTreeMap::new();
        let b = BTreeMap::new();
        assert_eq!(diff_assoc(&a, &b), BTreeMap::new());
    }

    #[test]
    fn identical_maps_have_no_diff() {
        let a = map(vec![("x", Value::Int(1)), ("y", Value::Str("z".into()))]);
        let b = a.clone();
        assert!(diff_assoc(&a, &b).is_empty());
    }

    #[test]
    fn key_only_in_a_is_kept() {
        let a = map(vec![("keep", Value::Int(1)), ("only_a", Value::Bool(true))]);
        let b = map(vec![("keep", Value::Int(1))]);
        let d = diff_assoc(&a, &b);
        assert_eq!(d, map(vec![("only_a", Value::Bool(true))]));
    }

    #[test]
    fn key_only_in_b_is_ignored() {
        // diffAssoc is asymmetric: extra keys in b do not appear.
        let a = map(vec![("keep", Value::Int(1))]);
        let b = map(vec![("keep", Value::Int(1)), ("only_b", Value::Int(9))]);
        assert!(diff_assoc(&a, &b).is_empty());
    }

    #[test]
    fn changed_scalar_is_kept_with_a_value() {
        let a = map(vec![("n", Value::Int(1))]);
        let b = map(vec![("n", Value::Int(2))]);
        assert_eq!(diff_assoc(&a, &b), map(vec![("n", Value::Int(1))]));
    }

    #[test]
    fn type_mismatch_is_a_difference() {
        // PHP `!==`: 1 (int) is not identical to "1" (string).
        let a = map(vec![("v", Value::Int(1))]);
        let b = map(vec![("v", Value::Str("1".into()))]);
        assert_eq!(diff_assoc(&a, &b), map(vec![("v", Value::Int(1))]));
    }

    #[test]
    fn nested_map_recurses_and_keeps_only_changed_subkeys() {
        let a = map(vec![(
            "cfg",
            Value::Map(map(vec![
                ("a", Value::Int(1)),
                ("b", Value::Int(2)),
                ("c", Value::Int(3)),
            ])),
        )]);
        let b = map(vec![(
            "cfg",
            Value::Map(map(vec![
                ("a", Value::Int(1)),
                ("b", Value::Int(99)), // changed
                ("c", Value::Int(3)),
            ])),
        )]);
        let d = diff_assoc(&a, &b);
        assert_eq!(
            d,
            map(vec![("cfg", Value::Map(map(vec![("b", Value::Int(2))])))])
        );
    }

    #[test]
    fn nested_map_with_no_changes_is_dropped() {
        let inner = Value::Map(map(vec![("a", Value::Int(1))]));
        let a = map(vec![("cfg", inner.clone())]);
        let b = map(vec![("cfg", inner)]);
        assert!(diff_assoc(&a, &b).is_empty());
    }

    #[test]
    fn map_vs_scalar_is_kept() {
        // a[k] is a map, b[k] is a scalar -> not both maps, not identical -> keep a.
        let a = map(vec![("v", Value::Map(map(vec![("x", Value::Int(1))])))]);
        let b = map(vec![("v", Value::Int(0))]);
        assert_eq!(diff_assoc(&a, &b), a.clone());
    }

    #[test]
    fn lists_compared_by_strict_identity() {
        let a = map(vec![("l", Value::List(vec![Value::Int(1), Value::Int(2)]))]);
        let same = a.clone();
        assert!(diff_assoc(&a, &same).is_empty());

        let b = map(vec![("l", Value::List(vec![Value::Int(1), Value::Int(3)]))]);
        assert_eq!(diff_assoc(&a, &b), a.clone());
    }

    #[test]
    fn deeply_nested_diff() {
        let a = map(vec![(
            "root",
            Value::Map(map(vec![(
                "child",
                Value::Map(map(vec![("leaf", Value::Str("old".into()))])),
            )])),
        )]);
        let b = map(vec![(
            "root",
            Value::Map(map(vec![(
                "child",
                Value::Map(map(vec![("leaf", Value::Str("new".into()))])),
            )])),
        )]);
        let d = diff_assoc(&a, &b);
        let expected = map(vec![(
            "root",
            Value::Map(map(vec![(
                "child",
                Value::Map(map(vec![("leaf", Value::Str("old".into()))])),
            )])),
        )]);
        assert_eq!(d, expected);
    }
}
