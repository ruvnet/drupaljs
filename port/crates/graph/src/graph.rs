//! Plain-Rust directed-graph dependency resolution.
//!
//! This module is the `rlib`-facing core: no `wasm-bindgen`, no JS types, just
//! ordinary Rust so it can be unit-tested with native `cargo test` and reused
//! by other crates. The WASM boundary lives in `lib.rs` and delegates here.
//!
//! Drupal models dependency ordering with `Drupal\Component\Graph\Graph`, which
//! runs a depth-first search to derive transitive `paths`, `reverse_paths`,
//! connected `component`s and a `weight` ordering. We provide the same building
//! blocks with explicit, well-known algorithms:
//!
//! - **Topological sort** (Kahn's algorithm) — module/service/config install order.
//! - **Cycle detection** — reject invalid dependency graphs.
//! - **Strongly connected components** (Tarjan) — group mutually dependent nodes.
//! - **Transitive closure** — "everything reachable from X" (Drupal's `paths`).
//!
//! Edges are expressed as `(from, to)` meaning *`from` depends on / points at `to`*.
//! Topological order returns dependencies before dependents when sorting on the
//! reverse edges; see [`Graph::topological_sort`] for the exact contract.

use std::collections::{BTreeMap, BTreeSet, VecDeque};

/// A directed graph keyed by stable string vertex ids.
///
/// Insertion of an edge implicitly registers both endpoints as vertices, so a
/// caller can build a graph purely from an edge list. Isolated vertices may be
/// added explicitly with [`Graph::add_vertex`].
///
/// Determinism: vertices and adjacency are stored in `BTreeMap`/`BTreeSet`, so
/// every traversal visits ids in sorted order. This makes results stable across
/// runs and platforms (important for reproducible WASM output and tests).
#[derive(Debug, Default, Clone)]
pub struct Graph {
    /// Adjacency: vertex -> set of successors (`from -> {to, ...}`).
    adjacency: BTreeMap<String, BTreeSet<String>>,
}

impl Graph {
    /// Creates an empty graph.
    pub fn new() -> Self {
        Graph {
            adjacency: BTreeMap::new(),
        }
    }

    /// Builds a graph from an edge list of `(from, to)` pairs.
    ///
    /// Both endpoints of every edge are registered as vertices.
    pub fn from_edges<I, S>(edges: I) -> Self
    where
        I: IntoIterator<Item = (S, S)>,
        S: Into<String>,
    {
        let mut graph = Graph::new();
        for (from, to) in edges {
            graph.add_edge(from, to);
        }
        graph
    }

    /// Registers a vertex with no edges (idempotent).
    pub fn add_vertex<S: Into<String>>(&mut self, vertex: S) {
        self.adjacency.entry(vertex.into()).or_default();
    }

    /// Adds a directed edge `from -> to`, registering both endpoints.
    ///
    /// Duplicate edges are coalesced (the adjacency set ignores repeats).
    pub fn add_edge<S: Into<String>>(&mut self, from: S, to: S) {
        let from = from.into();
        let to = to.into();
        self.adjacency.entry(to.clone()).or_default();
        self.adjacency.entry(from).or_default().insert(to);
    }

    /// Returns the vertices in deterministic (sorted) order.
    pub fn vertices(&self) -> Vec<String> {
        self.adjacency.keys().cloned().collect()
    }

    /// Number of vertices.
    pub fn vertex_count(&self) -> usize {
        self.adjacency.len()
    }

    /// Direct successors of `vertex` (the nodes it points at), sorted.
    pub fn successors(&self, vertex: &str) -> Vec<String> {
        self.adjacency
            .get(vertex)
            .map(|set| set.iter().cloned().collect())
            .unwrap_or_default()
    }

    /// Computes in-degrees for Kahn's algorithm: vertex -> number of incoming edges.
    fn in_degrees(&self) -> BTreeMap<String, usize> {
        let mut degree: BTreeMap<String, usize> =
            self.adjacency.keys().map(|v| (v.clone(), 0)).collect();
        for targets in self.adjacency.values() {
            for to in targets {
                *degree.entry(to.clone()).or_insert(0) += 1;
            }
        }
        degree
    }

    /// Topological sort using **Kahn's algorithm**.
    ///
    /// Returns `Ok(order)` where, for every edge `from -> to`, `from` appears
    /// **before** `to` in the result. If edges encode "dependent -> dependency"
    /// the result lists dependents first; if they encode "dependency ->
    /// dependent" the result is a valid install order (dependencies first).
    /// Callers choose edge direction to match their semantics — `@drupaljs/di`
    /// inserts edges as `service -> requiredService` and then reverses, or
    /// inserts `requiredService -> service` to get install order directly.
    ///
    /// Returns `Err(cycle)` if the graph contains a cycle; the `Err` payload is
    /// one set of vertices that are still mutually entangled (those never
    /// drained to in-degree zero), which is a superset of at least one cycle.
    ///
    /// Ties (multiple zero-in-degree vertices) are broken in sorted id order for
    /// determinism.
    pub fn topological_sort(&self) -> Result<Vec<String>, Vec<String>> {
        let mut in_degree = self.in_degrees();
        // Seed the queue with all zero-in-degree vertices, sorted.
        let mut queue: VecDeque<String> = in_degree
            .iter()
            .filter(|(_, &d)| d == 0)
            .map(|(v, _)| v.clone())
            .collect();

        let mut order = Vec::with_capacity(self.adjacency.len());
        while let Some(vertex) = queue.pop_front() {
            order.push(vertex.clone());
            for to in &self.adjacency[&vertex] {
                let entry = in_degree.get_mut(to).expect("edge target is a vertex");
                *entry -= 1;
                if *entry == 0 {
                    // Insert keeping the queue sorted so ties resolve deterministically.
                    let pos = queue.iter().position(|q| q > to).unwrap_or(queue.len());
                    queue.insert(pos, to.clone());
                }
            }
        }

        if order.len() == self.adjacency.len() {
            Ok(order)
        } else {
            // Remaining (non-zero in-degree) vertices are trapped in cycles.
            let cycle: Vec<String> = in_degree
                .into_iter()
                .filter(|(_, d)| *d > 0)
                .map(|(v, _)| v)
                .collect();
            Err(cycle)
        }
    }

    /// Returns `true` if the graph contains at least one directed cycle.
    pub fn has_cycle(&self) -> bool {
        self.topological_sort().is_err()
    }

    /// Finds all simple cycles is expensive; instead we expose the strongly
    /// connected components with more than one vertex (plus self-loops), which
    /// is the practical "what is circular?" answer for dependency resolution.
    ///
    /// Each returned group is a set of vertices that mutually reach each other.
    /// A single vertex with a self-edge (`a -> a`) is reported as a cycle group
    /// of `["a"]`; lone vertices without self-edges are not reported.
    pub fn cycles(&self) -> Vec<Vec<String>> {
        self.strongly_connected_components()
            .into_iter()
            .filter(|scc| scc.len() > 1 || self.has_self_loop(&scc[0]))
            .collect()
    }

    fn has_self_loop(&self, vertex: &str) -> bool {
        self.adjacency
            .get(vertex)
            .map(|set| set.contains(vertex))
            .unwrap_or(false)
    }

    /// Strongly connected components via **Tarjan's algorithm** (iterative).
    ///
    /// Returns a list of components; each component is a sorted list of vertex
    /// ids. The component list itself is sorted by each component's smallest id
    /// for determinism. In a DAG every component is a singleton.
    pub fn strongly_connected_components(&self) -> Vec<Vec<String>> {
        let mut state = TarjanState::new(&self.adjacency);
        // Visit vertices in deterministic order.
        for vertex in self.adjacency.keys() {
            if !state.indices.contains_key(vertex) {
                state.run(vertex);
            }
        }
        let mut components = state.components;
        for component in &mut components {
            component.sort();
        }
        components.sort_by(|a, b| a[0].cmp(&b[0]));
        components
    }

    /// Transitive closure: for each vertex, the set of vertices reachable from
    /// it via one or more edges (excluding the vertex itself unless it can reach
    /// itself through a cycle). This mirrors Drupal's `paths` secondary key.
    ///
    /// Returns a map `vertex -> sorted reachable vertices`.
    pub fn transitive_closure(&self) -> BTreeMap<String, Vec<String>> {
        let mut closure = BTreeMap::new();
        for start in self.adjacency.keys() {
            let mut reachable = BTreeSet::new();
            let mut stack: Vec<String> = self.adjacency[start].iter().cloned().collect();
            while let Some(node) = stack.pop() {
                if reachable.insert(node.clone()) {
                    if let Some(next) = self.adjacency.get(&node) {
                        for n in next {
                            if !reachable.contains(n) {
                                stack.push(n.clone());
                            }
                        }
                    }
                }
            }
            closure.insert(start.clone(), reachable.into_iter().collect());
        }
        closure
    }

    /// Reachable set from a single `start` vertex (the row of the transitive
    /// closure for `start`). Returns an empty vec for unknown vertices.
    pub fn reachable_from(&self, start: &str) -> Vec<String> {
        if !self.adjacency.contains_key(start) {
            return Vec::new();
        }
        let mut reachable = BTreeSet::new();
        let mut stack: Vec<String> = self.adjacency[start].iter().cloned().collect();
        while let Some(node) = stack.pop() {
            if reachable.insert(node.clone()) {
                if let Some(next) = self.adjacency.get(&node) {
                    for n in next {
                        if !reachable.contains(n) {
                            stack.push(n.clone());
                        }
                    }
                }
            }
        }
        reachable.into_iter().collect()
    }
}

/// Iterative Tarjan SCC bookkeeping.
struct TarjanState<'a> {
    adjacency: &'a BTreeMap<String, BTreeSet<String>>,
    index_counter: usize,
    indices: BTreeMap<String, usize>,
    lowlink: BTreeMap<String, usize>,
    on_stack: BTreeSet<String>,
    stack: Vec<String>,
    components: Vec<Vec<String>>,
}

impl<'a> TarjanState<'a> {
    fn new(adjacency: &'a BTreeMap<String, BTreeSet<String>>) -> Self {
        TarjanState {
            adjacency,
            index_counter: 0,
            indices: BTreeMap::new(),
            lowlink: BTreeMap::new(),
            on_stack: BTreeSet::new(),
            stack: Vec::new(),
            components: Vec::new(),
        }
    }

    /// Iterative DFS to avoid blowing the native/WASM stack on deep graphs.
    fn run(&mut self, root: &str) {
        // Each frame tracks the vertex and an iterator position into its successors.
        let mut work: Vec<(String, Vec<String>, usize)> = Vec::new();

        let root_succ = self.successors_of(root);
        self.discover(root);
        work.push((root.to_string(), root_succ, 0));

        while let Some((vertex, succ, mut i)) = work.pop() {
            let mut recursed = false;
            while i < succ.len() {
                let w = succ[i].clone();
                i += 1;
                if !self.indices.contains_key(&w) {
                    // Tree edge: descend into w, resume vertex later at i.
                    let w_succ = self.successors_of(&w);
                    self.discover(&w);
                    work.push((vertex.clone(), succ, i));
                    work.push((w, w_succ, 0));
                    recursed = true;
                    break;
                } else if self.on_stack.contains(&w) {
                    // Back/cross edge to a vertex on the stack: update lowlink.
                    let w_index = self.indices[&w];
                    let entry = self.lowlink.get_mut(&vertex).unwrap();
                    if w_index < *entry {
                        *entry = w_index;
                    }
                }
            }
            if recursed {
                continue;
            }

            // Finished exploring `vertex`: if it's a root, pop its SCC.
            if self.lowlink[&vertex] == self.indices[&vertex] {
                let mut component = Vec::new();
                loop {
                    let w = self.stack.pop().expect("stack non-empty at root");
                    self.on_stack.remove(&w);
                    component.push(w.clone());
                    if w == vertex {
                        break;
                    }
                }
                self.components.push(component);
            }

            // Propagate this vertex's lowlink up to its parent (top of work stack).
            if let Some((parent, _, _)) = work.last() {
                let v_low = self.lowlink[&vertex];
                let parent = parent.clone();
                let entry = self.lowlink.get_mut(&parent).unwrap();
                if v_low < *entry {
                    *entry = v_low;
                }
            }
        }
    }

    fn discover(&mut self, vertex: &str) {
        self.indices.insert(vertex.to_string(), self.index_counter);
        self.lowlink.insert(vertex.to_string(), self.index_counter);
        self.index_counter += 1;
        self.stack.push(vertex.to_string());
        self.on_stack.insert(vertex.to_string());
    }

    fn successors_of(&self, vertex: &str) -> Vec<String> {
        self.adjacency
            .get(vertex)
            .map(|set| set.iter().cloned().collect())
            .unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn g(edges: &[(&str, &str)]) -> Graph {
        Graph::from_edges(edges.iter().map(|(a, b)| (a.to_string(), b.to_string())))
    }

    // ---- construction ----

    #[test]
    fn from_edges_registers_both_endpoints() {
        let graph = g(&[("a", "b")]);
        assert_eq!(graph.vertices(), vec!["a", "b"]);
        assert_eq!(graph.vertex_count(), 2);
    }

    #[test]
    fn add_vertex_creates_isolated_node() {
        let mut graph = Graph::new();
        graph.add_vertex("solo");
        assert_eq!(graph.vertices(), vec!["solo"]);
        assert!(graph.successors("solo").is_empty());
    }

    #[test]
    fn duplicate_edges_are_coalesced() {
        let mut graph = Graph::new();
        graph.add_edge("a", "b");
        graph.add_edge("a", "b");
        assert_eq!(graph.successors("a"), vec!["b"]);
    }

    // ---- topological sort (Kahn) ----

    #[test]
    fn topo_sort_orders_dependencies_first() {
        // 1->2, 2->3, 2->4, 3->4 (Drupal's docblock example).
        let graph = g(&[("1", "2"), ("2", "3"), ("2", "4"), ("3", "4")]);
        let order = graph.topological_sort().expect("acyclic");
        let pos = |id: &str| order.iter().position(|v| v == id).unwrap();
        assert!(pos("1") < pos("2"));
        assert!(pos("2") < pos("3"));
        assert!(pos("2") < pos("4"));
        assert!(pos("3") < pos("4"));
    }

    #[test]
    fn topo_sort_is_deterministic_on_ties() {
        // Two independent roots a and b should come out sorted.
        let graph = g(&[("a", "c"), ("b", "c")]);
        let order = graph.topological_sort().expect("acyclic");
        assert_eq!(order, vec!["a", "b", "c"]);
    }

    #[test]
    fn topo_sort_handles_isolated_vertices() {
        let mut graph = g(&[("a", "b")]);
        graph.add_vertex("z");
        let order = graph.topological_sort().expect("acyclic");
        assert_eq!(order.len(), 3);
        assert!(order.contains(&"z".to_string()));
    }

    #[test]
    fn topo_sort_errors_on_cycle() {
        let graph = g(&[("a", "b"), ("b", "a")]);
        let err = graph.topological_sort().expect_err("cyclic");
        assert!(err.contains(&"a".to_string()));
        assert!(err.contains(&"b".to_string()));
    }

    // ---- cycle detection ----

    #[test]
    fn has_cycle_false_for_dag() {
        let graph = g(&[("1", "2"), ("2", "3"), ("2", "4"), ("3", "4")]);
        assert!(!graph.has_cycle());
    }

    #[test]
    fn has_cycle_true_for_two_node_cycle() {
        let graph = g(&[("a", "b"), ("b", "a")]);
        assert!(graph.has_cycle());
    }

    #[test]
    fn has_cycle_true_for_self_loop() {
        let graph = g(&[("a", "a")]);
        assert!(graph.has_cycle());
    }

    // ---- cycles / SCC ----

    #[test]
    fn cycles_reports_mutual_group() {
        let graph = g(&[("a", "b"), ("b", "c"), ("c", "a"), ("c", "d")]);
        let cycles = graph.cycles();
        assert_eq!(cycles.len(), 1);
        assert_eq!(cycles[0], vec!["a", "b", "c"]);
    }

    #[test]
    fn cycles_reports_self_loop() {
        let graph = g(&[("a", "a"), ("a", "b")]);
        let cycles = graph.cycles();
        assert_eq!(cycles, vec![vec!["a"]]);
    }

    #[test]
    fn cycles_empty_for_dag() {
        let graph = g(&[("a", "b"), ("b", "c")]);
        assert!(graph.cycles().is_empty());
    }

    #[test]
    fn scc_singletons_for_dag() {
        let graph = g(&[("1", "2"), ("2", "3")]);
        let sccs = graph.strongly_connected_components();
        assert_eq!(sccs, vec![vec!["1"], vec!["2"], vec!["3"]]);
    }

    #[test]
    fn scc_groups_two_cycles() {
        // Two separate cycles: {a,b} and {x,y}, linked b->x.
        let graph = g(&[("a", "b"), ("b", "a"), ("b", "x"), ("x", "y"), ("y", "x")]);
        let sccs = graph.strongly_connected_components();
        assert!(sccs.contains(&vec!["a".to_string(), "b".to_string()]));
        assert!(sccs.contains(&vec!["x".to_string(), "y".to_string()]));
    }

    #[test]
    fn scc_handles_deep_chain_without_stack_overflow() {
        // 10k-node chain exercises the iterative Tarjan path.
        let edges: Vec<(String, String)> = (0..10_000)
            .map(|i| (format!("n{:05}", i), format!("n{:05}", i + 1)))
            .collect();
        let graph = Graph::from_edges(edges);
        let sccs = graph.strongly_connected_components();
        assert_eq!(sccs.len(), 10_001);
        assert!(sccs.iter().all(|c| c.len() == 1));
    }

    // ---- transitive closure ----

    #[test]
    fn transitive_closure_matches_drupal_paths() {
        let graph = g(&[("1", "2"), ("2", "3"), ("2", "4"), ("3", "4")]);
        let closure = graph.transitive_closure();
        assert_eq!(closure["1"], vec!["2", "3", "4"]);
        assert_eq!(closure["2"], vec!["3", "4"]);
        assert_eq!(closure["3"], vec!["4"]);
        assert!(closure["4"].is_empty());
    }

    #[test]
    fn transitive_closure_includes_self_in_cycle() {
        let graph = g(&[("a", "b"), ("b", "a")]);
        let closure = graph.transitive_closure();
        assert_eq!(closure["a"], vec!["a", "b"]);
        assert_eq!(closure["b"], vec!["a", "b"]);
    }

    #[test]
    fn reachable_from_unknown_vertex_is_empty() {
        let graph = g(&[("a", "b")]);
        assert!(graph.reachable_from("nope").is_empty());
    }

    #[test]
    fn reachable_from_matches_closure_row() {
        let graph = g(&[("1", "2"), ("2", "3")]);
        assert_eq!(graph.reachable_from("1"), vec!["2", "3"]);
    }
}
