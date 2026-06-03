# ADR-0015: Rust→WASM for Complex / Perf-Critical Algorithms

**Status**: Accepted
**Date**: 2026-06-03
**Tags**: port, rust, wasm, performance, algorithms

## Context

Some Drupal subsystems hinge on algorithms that are CPU-bound, security-sensitive,
or table-heavy, where hand-written TS would be slow or error-prone.

## Decision

Implement these as **Rust crates compiled to WASM** (`wasm-bindgen`, built with
`wasm-pack`, `crate-type = ["cdylib","rlib"]`) under `port/crates/*`, consumed by
the owning TS package. Initial targets:

- **diff** — Myers diff (config diff, text comparison)
- **xss-html** — HTML tokenizer/filter automaton (`Xss`, `Html` filtering)
- **graph** — topological sort & SCC (module/service/config dependency resolution)
- **transliteration** — large transliteration tables
- **cache-checksum** — cache-tag checksum/invalidation hashing
- **route-matcher** — compiled route regex matching
- **search-tokenizer** — tokenizer/stemmer for the search index
- **password-hash** — phpass-compatible password hashing

Each crate ships `#[cfg(test)]` unit tests (`cargo test`) plus a typed TS wrapper.

## Consequences

- **Positive**: Native-class speed, memory safety, shared logic reusable server &
  browser; isolates the hardest code behind small typed boundaries.
- **Negative**: Adds a Rust + `wasm-pack` toolchain requirement; WASM init/marshalling
  overhead must be amortized (batch calls). Async load boundary in TS.

## Related

- Crates are owned 1-per-agent under the model in [[ADR-0017]].
- Consumed by TS packages from [[ADR-0014]].
