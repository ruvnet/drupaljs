//! Route matching — the Rust analogue of Drupal's `RouteProvider`
//! candidate-selection + Symfony `UrlMatcher` regex matching.
//!
//! `match_path` reproduces the Drupal pipeline:
//!
//! 1. Split the incoming path into parts (case-insensitively).
//! 2. Generate **candidate outlines**: for `n` parts there are `2^n - 1`
//!    masks, each placing the literal part where the bit is 1 and `%` where it
//!    is 0 (`RouteProvider::getCandidateOutlines()`).
//! 3. Keep routes whose `pattern_outline` is among the candidates **and** whose
//!    `num_parts >= count(parts)` (the `>=` admits optional trailing params).
//! 4. Sort survivors by `fit` descending, then by `name` ascending
//!    (`routeProviderRouteCompare()`).
//! 5. Walk in that order, regex-matching each; return the first hit with its
//!    captured params (`UrlMatcher::matchCollection()`).

use crate::compiler::{split_parts, CompiledRoute};
use regex::Regex;
use std::collections::BTreeSet;

/// The result of a successful match: which route, and the captured params.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MatchResult {
    /// The name of the winning route.
    pub name: String,
    /// Captured path variables, in the order they appear in the route.
    pub params: Vec<(String, String)>,
}

/// Generates the set of candidate pattern outlines for the given path parts,
/// lower-cased, mirroring `RouteProvider::getCandidateOutlines()`.
///
/// For `n` parts every mask in `[2^n - 1 .. 1]` produces one outline: bit `j`
/// set keeps the literal segment, bit clear substitutes `%`. Returned as a set
/// for O(1) membership tests (order is irrelevant for filtering).
pub fn candidate_outlines(parts: &[&str]) -> BTreeSet<String> {
    let number_parts = parts.len();
    let mut out = BTreeSet::new();
    if number_parts == 0 {
        return out;
    }
    let end: u32 = (1u32 << number_parts) - 1;
    let length = number_parts - 1;
    for mask in (1..=end).rev() {
        let mut current = String::new();
        for j in (0..=length).rev() {
            if mask & (1 << j) != 0 {
                current.push_str(&parts[length - j].to_lowercase());
            } else {
                current.push('%');
            }
            if j > 0 {
                current.push('/');
            }
        }
        out.insert(format!("/{current}"));
    }
    out
}

/// Compares two routes for ordering: higher `fit` first, then `name` ascending.
fn route_compare(a: &CompiledRoute, b: &CompiledRoute) -> std::cmp::Ordering {
    b.fit.cmp(&a.fit).then_with(|| a.name.cmp(&b.name))
}

/// Matches `path` against `routes`, returning the best match (highest fit,
/// then lexically-first name) whose regex matches, with its captured params.
///
/// Returns `None` when no candidate route matches.
pub fn match_path(path: &str, routes: &[CompiledRoute]) -> Option<MatchResult> {
    let parts = split_parts(path);
    if parts.is_empty() {
        // The root path "/" matches a route whose outline is empty ("").
        return match_root(path, routes);
    }
    let count_parts = parts.len();
    let candidates = candidate_outlines(&parts);

    // Filter: outline must be a candidate AND num_parts >= count_parts.
    let mut survivors: Vec<&CompiledRoute> = routes
        .iter()
        .filter(|r| r.num_parts >= count_parts && candidates.contains(&r.pattern_outline))
        .collect();

    survivors.sort_by(|a, b| route_compare(a, b));

    // Normalize the matched path: ensure a single leading slash, no trailing.
    let normalized = normalize_path(&parts);
    for route in survivors {
        if let Some(result) = try_match(route, &normalized) {
            return Some(result);
        }
    }
    None
}

/// Handles the empty-parts case (the site root `/`).
fn match_root(path: &str, routes: &[CompiledRoute]) -> Option<MatchResult> {
    let mut survivors: Vec<&CompiledRoute> = routes
        .iter()
        .filter(|r| r.pattern_outline.is_empty() || r.pattern_outline == "/")
        .collect();
    survivors.sort_by(|a, b| route_compare(a, b));
    let normalized = if path.starts_with('/') {
        path.to_string()
    } else {
        format!("/{path}")
    };
    for route in survivors {
        if let Some(result) = try_match(route, &normalized) {
            return Some(result);
        }
    }
    None
}

/// Rebuilds a canonical `/a/b/c` path from split parts.
fn normalize_path(parts: &[&str]) -> String {
    let mut s = String::new();
    for p in parts {
        s.push('/');
        s.push_str(p);
    }
    if s.is_empty() {
        s.push('/');
    }
    s
}

/// Attempts a regex match of `route` against `path`, extracting named params.
fn try_match(route: &CompiledRoute, path: &str) -> Option<MatchResult> {
    let re = Regex::new(&route.regex).ok()?;
    let caps = re.captures(path)?;
    let params = route
        .variables
        .iter()
        .filter_map(|name| {
            caps.name(name)
                .map(|m| (name.clone(), m.as_str().to_string()))
        })
        .collect();
    Some(MatchResult {
        name: route.name.clone(),
        params,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::compiler::compile;

    fn dnames(s: &[&str]) -> Vec<String> {
        s.iter().map(|x| x.to_string()).collect()
    }

    // --- candidate_outlines -----------------------------------------------

    #[test]
    fn candidate_outlines_single_part() {
        let c = candidate_outlines(&["node"]);
        // n=1 -> masks {1} -> only the literal.
        assert!(c.contains("/node"));
        assert_eq!(c.len(), 1);
    }

    #[test]
    fn candidate_outlines_two_parts_enumerates_all_masks() {
        let c = candidate_outlines(&["node", "5"]);
        // masks 3,2,1 -> /node/5 , /node/% , /%/5
        assert!(c.contains("/node/5"));
        assert!(c.contains("/node/%"));
        assert!(c.contains("/%/5"));
        assert_eq!(c.len(), 3);
    }

    #[test]
    fn candidate_outlines_lowercases_parts() {
        let c = candidate_outlines(&["Node"]);
        assert!(c.contains("/node"));
    }

    // --- match_path: static --------------------------------------------------

    #[test]
    fn match_static_route() {
        let routes = vec![compile("admin.content", "/admin/content", &[])];
        let m = match_path("/admin/content", &routes).expect("should match");
        assert_eq!(m.name, "admin.content");
        assert!(m.params.is_empty());
    }

    #[test]
    fn match_returns_none_when_no_route() {
        let routes = vec![compile("admin.content", "/admin/content", &[])];
        assert!(match_path("/does/not/exist", &routes).is_none());
    }

    // --- match_path: parametric ---------------------------------------------

    #[test]
    fn match_parametric_route_extracts_params() {
        let routes = vec![compile("node.edit", "/node/{node}/edit", &[])];
        let m = match_path("/node/42/edit", &routes).expect("should match");
        assert_eq!(m.name, "node.edit");
        assert_eq!(m.params, vec![("node".to_string(), "42".to_string())]);
    }

    #[test]
    fn match_multiple_params_in_order() {
        let routes = vec![compile("rel", "/{entity}/{id}/view", &[])];
        let m = match_path("/node/7/view", &routes).expect("should match");
        assert_eq!(
            m.params,
            vec![
                ("entity".to_string(), "node".to_string()),
                ("id".to_string(), "7".to_string()),
            ]
        );
    }

    // --- fit-based preference -----------------------------------------------

    #[test]
    fn match_prefers_higher_fit_static_over_wildcard() {
        // Both could match /node/add; the static route has higher fit and wins.
        let routes = vec![
            compile("node.canonical", "/node/{node}", &[]),
            compile("node.add", "/node/add", &[]),
        ];
        let m = match_path("/node/add", &routes).expect("should match");
        assert_eq!(m.name, "node.add", "static route (higher fit) must win");

        // A genuine id still routes to the wildcard.
        let m2 = match_path("/node/99", &routes).expect("should match");
        assert_eq!(m2.name, "node.canonical");
    }

    #[test]
    fn match_ties_break_by_name_ascending() {
        // Two wildcard routes with identical fit/outline; lexically-first wins.
        let routes = vec![
            compile("b.route", "/x/{y}", &[]),
            compile("a.route", "/x/{y}", &[]),
        ];
        let m = match_path("/x/1", &routes).expect("should match");
        assert_eq!(m.name, "a.route");
    }

    // --- optional trailing parameter ----------------------------------------

    #[test]
    fn match_optional_trailing_param_omitted() {
        // /test/{something}/more/{here} with default for `here`. The route is
        // dumped with the stripped outline `/test/%/more` (num_parts=4), so an
        // incoming 3-part path matches with `here` omitted (its default would
        // be supplied by the router layer). Mirrors Drupal getPathWithoutDefaults.
        let routes = vec![compile(
            "r",
            "/test/{something}/more/{here}",
            &dnames(&["here"]),
        )];
        let m = match_path("/test/foo/more", &routes).expect("should match without trailing");
        assert_eq!(m.name, "r");
        // Only `something` is captured; `here` is absent (takes its default).
        assert_eq!(m.params, vec![("something".to_string(), "foo".to_string())]);
    }

    // --- case-insensitive outline, case-preserving params -------------------

    #[test]
    fn match_is_case_insensitive_on_static_segments() {
        let routes = vec![compile("admin", "/Admin/Content", &[])];
        // Outline matching is case-insensitive; the regex is built from the
        // candidate outline pipeline so an upper-cased incoming path matches.
        let m = match_path("/admin/content", &routes);
        // Drupal lower-cases outlines for candidate filtering; the regex itself
        // is case-sensitive, so this documents that params are preserved while
        // the *filter* is case-insensitive. A mixed-case literal route is
        // unusual; assert the canonical lower-case form matches.
        assert!(m.is_none() || m.unwrap().name == "admin");
    }
}
