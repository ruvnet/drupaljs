//! `drupaljs-graph` — directed-graph dependency resolution for Drupal.js.
//!
//! Provides topological sort (Kahn), cycle detection, Tarjan strongly-connected
//! components and transitive closure, used to order module installs, service
//! container wiring and config import. The algorithms are the Rust analogue of
//! Drupal's `Drupal\Component\Graph\Graph` (`searchAndSort()` derives `paths`,
//! `reverse_paths`, `component` and `weight`).
//!
//! Two surfaces are exported:
//!
//! 1. **Plain-Rust API** ([`graph::Graph`]) for the `rlib` — typed, panic-free,
//!    no JS marshalling. Other crates depend on this directly.
//! 2. **`#[wasm_bindgen]` API** (this file) for the `cdylib` — edges arrive as a
//!    flat `js_sys`-friendly `Vec<String>` of `[from0, to0, from1, to1, ...]`
//!    and results come back as JSON strings so the boundary stays simple and
//!    allocation-light (one marshalled buffer in, one string out per call —
//!    batch your edges, per ADR-0015's "amortize WASM overhead" note).
//!
//! ## TypeScript wrapper (consumed by `@drupaljs/di` / hook system)
//!
//! `wasm-pack build --target web` (or `bundler`) emits `pkg/`. A thin TS wrapper
//! flattens an edge list and parses the JSON result, e.g.:
//!
//! ```ts
//! import init, { topo_sort, find_cycles } from "drupaljs-graph";
//! await init();
//! function flatten(edges: [string, string][]): string[] {
//!   return edges.flatMap(([from, to]) => [from, to]);
//! }
//! // Returns { ok: true, order: string[] } or { ok: false, cycle: string[] }.
//! const result = JSON.parse(topo_sort(flatten(edges)));
//! const cycles: string[][] = JSON.parse(find_cycles(flatten(edges)));
//! ```
//!
//! `@drupaljs/di` builds edges as `requiredService -> service` so a successful
//! `topo_sort` yields a valid instantiation order (dependencies first); the
//! hook/module installer does the same for `module -> dependentModule`. When
//! `ok` is `false`, `cycle` names the entangled ids for an actionable error.

mod graph;

pub use graph::Graph;

use wasm_bindgen::prelude::*;

/// Reconstructs a [`Graph`] from a flat `[from, to, from, to, ...]` edge buffer.
///
/// A trailing unpaired element (odd-length input) is ignored, keeping the
/// boundary forgiving for malformed JS callers rather than panicking.
fn graph_from_flat(flat: &[String]) -> Graph {
    let mut g = Graph::new();
    let mut it = flat.chunks_exact(2);
    for pair in &mut it {
        g.add_edge(pair[0].clone(), pair[1].clone());
    }
    g
}

/// JSON-encodes a list of strings without pulling in `serde` (keeps the WASM
/// bundle small per ADR-0015's `opt-level = "s"`).
fn json_string_array(items: &[String]) -> String {
    let mut out = String::from("[");
    for (i, item) in items.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        push_json_string(&mut out, item);
    }
    out.push(']');
    out
}

/// JSON-encodes a list of string lists.
fn json_string_array_2d(groups: &[Vec<String>]) -> String {
    let mut out = String::from("[");
    for (i, group) in groups.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        out.push_str(&json_string_array(group));
    }
    out.push(']');
    out
}

/// Appends a JSON-escaped, quoted string to `out`.
fn push_json_string(out: &mut String, value: &str) {
    out.push('"');
    for ch in value.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
}

/// Topological sort over the flattened edge list.
///
/// Returns a JSON object string:
/// - on success: `{"ok":true,"order":["a","b",...]}` where every edge `from->to`
///   places `from` before `to`;
/// - on a cycle: `{"ok":false,"cycle":["x","y",...]}` naming entangled vertices.
#[wasm_bindgen]
pub fn topo_sort(edges: Vec<String>) -> String {
    let g = graph_from_flat(&edges);
    match g.topological_sort() {
        Ok(order) => {
            let mut out = String::from("{\"ok\":true,\"order\":");
            out.push_str(&json_string_array(&order));
            out.push('}');
            out
        }
        Err(cycle) => {
            let mut out = String::from("{\"ok\":false,\"cycle\":");
            out.push_str(&json_string_array(&cycle));
            out.push('}');
            out
        }
    }
}

/// Returns `true` if the flattened edge list contains a directed cycle.
#[wasm_bindgen]
pub fn has_cycle(edges: Vec<String>) -> bool {
    graph_from_flat(&edges).has_cycle()
}

/// Returns the cyclic groups as a JSON `string[][]`.
///
/// Each inner array is one strongly connected component with more than one
/// member (or a self-looping vertex). Empty `[]` means the graph is acyclic.
#[wasm_bindgen]
pub fn find_cycles(edges: Vec<String>) -> String {
    json_string_array_2d(&graph_from_flat(&edges).cycles())
}

/// Returns all strongly connected components as a JSON `string[][]`.
#[wasm_bindgen]
pub fn strongly_connected_components(edges: Vec<String>) -> String {
    json_string_array_2d(&graph_from_flat(&edges).strongly_connected_components())
}

/// Returns the set of vertices reachable from `start` (transitive closure row)
/// as a JSON `string[]`. Unknown `start` yields `[]`.
#[wasm_bindgen]
pub fn reachable_from(edges: Vec<String>, start: String) -> String {
    json_string_array(&graph_from_flat(&edges).reachable_from(&start))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn flat(pairs: &[(&str, &str)]) -> Vec<String> {
        pairs
            .iter()
            .flat_map(|(a, b)| [a.to_string(), b.to_string()])
            .collect()
    }

    #[test]
    fn graph_from_flat_pairs_edges() {
        let g = graph_from_flat(&flat(&[("a", "b"), ("b", "c")]));
        assert_eq!(g.vertices(), vec!["a", "b", "c"]);
    }

    #[test]
    fn graph_from_flat_ignores_odd_trailing_element() {
        let g = graph_from_flat(&["a".into(), "b".into(), "dangling".into()]);
        assert_eq!(g.vertices(), vec!["a", "b"]);
    }

    #[test]
    fn topo_sort_success_shape() {
        let json = topo_sort(flat(&[("1", "2"), ("2", "3")]));
        assert_eq!(json, r#"{"ok":true,"order":["1","2","3"]}"#);
    }

    #[test]
    fn topo_sort_cycle_shape() {
        let json = topo_sort(flat(&[("a", "b"), ("b", "a")]));
        assert!(json.starts_with(r#"{"ok":false,"cycle":["#));
        assert!(json.contains("\"a\""));
        assert!(json.contains("\"b\""));
    }

    #[test]
    fn has_cycle_boundary() {
        assert!(has_cycle(flat(&[("a", "b"), ("b", "a")])));
        assert!(!has_cycle(flat(&[("a", "b"), ("b", "c")])));
    }

    #[test]
    fn find_cycles_shape() {
        let json = find_cycles(flat(&[("a", "b"), ("b", "c"), ("c", "a")]));
        assert_eq!(json, r#"[["a","b","c"]]"#);
    }

    #[test]
    fn find_cycles_empty_for_dag() {
        assert_eq!(find_cycles(flat(&[("a", "b")])), "[]");
    }

    #[test]
    fn scc_shape() {
        let json = strongly_connected_components(flat(&[("1", "2"), ("2", "3")]));
        assert_eq!(json, r#"[["1"],["2"],["3"]]"#);
    }

    #[test]
    fn reachable_from_shape() {
        let json = reachable_from(flat(&[("1", "2"), ("2", "3")]), "1".into());
        assert_eq!(json, r#"["2","3"]"#);
    }

    #[test]
    fn reachable_from_unknown_is_empty_array() {
        assert_eq!(reachable_from(flat(&[("a", "b")]), "z".into()), "[]");
    }

    #[test]
    fn json_string_escapes_special_chars() {
        let mut out = String::new();
        push_json_string(&mut out, "a\"b\\c\n");
        assert_eq!(out, r#""a\"b\\c\n""#);
    }
}
