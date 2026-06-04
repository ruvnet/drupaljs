//! `drupaljs-diff` — Myers line diff + recursive associative array diff.
//!
//! Port of Drupal's diff machinery to Rust/WASM (ADR-0015):
//!
//! * [`myers`] — Myers O(ND) shortest-edit-script over line sequences, used for
//!   text comparison and config-text diffs.
//! * [`array_diff`] — `DiffArray::diffAssoc` recursive map diff, used by config
//!   diff to compute changed keys between two config arrays.
//!
//! Both expose a plain-Rust API (for `rlib` consumers and `cargo test`) and a
//! `#[wasm_bindgen]` surface (for the owning TS package). The WASM line-diff
//! entry takes `string[]` for `a` and `b` and returns an array of
//! `{ kind: "equal"|"insert"|"delete", lines: string[] }` objects.

pub mod array_diff;
pub mod myers;

pub use array_diff::{diff_assoc, Value};
pub use myers::{diff_lines, EditOp};

use serde::Serialize;
use wasm_bindgen::prelude::*;

/// JSON-shaped edit op for the WASM/JS boundary.
#[derive(Serialize)]
struct JsEditOp {
    kind: &'static str,
    lines: Vec<String>,
}

impl From<&EditOp> for JsEditOp {
    fn from(op: &EditOp) -> Self {
        JsEditOp {
            kind: op.kind(),
            lines: op.lines().to_vec(),
        }
    }
}

/// WASM entry: diff two arrays of lines, returning the edit script.
///
/// `a` and `b` are JS `string[]` (marshalled as `Vec<String>`). The result is a
/// JS array of `{ kind, lines }` objects in document order.
#[wasm_bindgen(js_name = diffLines)]
pub fn diff_lines_wasm(a: Vec<String>, b: Vec<String>) -> Result<JsValue, JsValue> {
    let ops = diff_lines(&a, &b);
    let js: Vec<JsEditOp> = ops.iter().map(JsEditOp::from).collect();
    serde_wasm_bindgen::to_value(&js).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Convenience WASM entry: split two strings on `\n` and diff the lines.
///
/// Returns the same `{ kind, lines }[]` shape as [`diff_lines_wasm`].
#[wasm_bindgen(js_name = diffText)]
pub fn diff_text_wasm(a: &str, b: &str) -> Result<JsValue, JsValue> {
    let al: Vec<String> = a.split('\n').map(|s| s.to_string()).collect();
    let bl: Vec<String> = b.split('\n').map(|s| s.to_string()).collect();
    let ops = diff_lines(&al, &bl);
    let js: Vec<JsEditOp> = ops.iter().map(JsEditOp::from).collect();
    serde_wasm_bindgen::to_value(&js).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[cfg(test)]
mod tests {
    //! Integration-level tests exercising the public crate API surface
    //! (the plain-Rust side; the `#[wasm_bindgen]` shims are thin adapters).
    use super::*;
    use std::collections::BTreeMap;

    #[test]
    fn public_line_diff_reexport_works() {
        let a = ["a", "b"];
        let b = ["a", "c"];
        let ops = diff_lines(&a, &b);
        assert!(ops
            .iter()
            .any(|o| matches!(o, EditOp::Delete(l) if l == &vec!["b".to_string()])));
        assert!(ops
            .iter()
            .any(|o| matches!(o, EditOp::Insert(l) if l == &vec!["c".to_string()])));
    }

    #[test]
    fn public_array_diff_reexport_works() {
        let mut a = BTreeMap::new();
        a.insert("k".to_string(), Value::Int(1));
        let mut b = BTreeMap::new();
        b.insert("k".to_string(), Value::Int(2));
        let d = diff_assoc(&a, &b);
        assert_eq!(d.get("k"), Some(&Value::Int(1)));
    }

    #[test]
    fn edit_op_kind_tags_are_stable() {
        assert_eq!(EditOp::Equal(vec![]).kind(), "equal");
        assert_eq!(EditOp::Insert(vec![]).kind(), "insert");
        assert_eq!(EditOp::Delete(vec![]).kind(), "delete");
    }
}
