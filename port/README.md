# Drupal.js — TypeScript/Rust Port of Drupal Core

A ground-up port of **Drupal 11 core** to TypeScript, with **Rust→WASM** for
complex/perf-critical algorithms. Built TDD-first (London school), coordinated by
a multi-agent swarm. Tracking epic: [ruvnet/drupaljs#4](https://github.com/ruvnet/drupaljs/issues/4).

## Status

| | |
|---|---|
| TypeScript packages | **90** (`@drupaljs/*`) |
| Rust/WASM crates | **9** (`drupaljs-*`) |
| TS tests | **2,499 passing** (330 files, Vitest) |
| Rust tests | **268 passing** (`cargo test --workspace`) |
| Core modules ported | **43/43** |

**Kernel:** di · event-dispatcher · hook · plugin · config · cache · typed-data ·
routing · render · http-kernel · theme · entity · database · util · datetime ·
validation · serialization · state-keyvalue · lock · queue · cron · file-system ·
logger · mail · session · access · form · ajax · menu · breadcrumb · pager ·
batch · language · string-translation · contracts · testing.

**Fields/services:** field · field-ui · text · options · link · datetime-field ·
path-alias · content-translation · locale · editor · filter.

**Modules (`module-*`):** system · user · node · taxonomy · comment · block(+content) ·
menu_ui · menu_link_content · file · image · media(+library) · path · search ·
ckeditor5 · content_moderation · workflows · workspaces · layout_builder(+discovery) ·
views(+ui) · jsonapi · rest · contact · contextual · toolbar · big_pipe ·
dynamic_page_cache · page_cache · breakpoint · responsive_image · migrate(+drupal) ·
update · dblog · syslog · shortcut · book · history · tour · help.

**Rust/WASM crates:** graph (topo-sort/SCC) · diff (Myers) · xss-html (filter automaton) ·
cache-checksum · crypt · password-hash (phpass) · route-matcher · transliteration · uuid.

> **Scope honesty:** this is a faithful, test-backed port of Drupal core's
> *architecture and subsystem contracts* — not a drop-in replacement for a running
> Drupal site. Many subsystems are minimal-but-correct vertical slices (notably
> `views`, `migrate`, `entity`/`field`) with documented `TODO`s for deferred depth.
> See per-package source and the ADRs (`../docs/adr/`) for exact coverage.

## Layout

```
port/
├── package.json          # npm workspaces -> packages/*
├── tsconfig.base.json    # shared strict TS config
├── Cargo.toml            # Rust workspace -> crates/* (wasm-bindgen libs)
├── vitest.workspace.ts   # test projects across all packages
├── scripts/build-wasm.mjs
├── packages/<name>/      # one TS package per Drupal subsystem/module
└── crates/<name>/        # one Rust crate per complex algorithm (compiled to WASM)
```

## Agent ownership rule (no conflicts)

**Each agent owns exactly one `packages/<name>/` or `crates/<name>/` directory.**
Never edit another agent's directory or any shared root file (`package.json`,
`Cargo.toml`, `tsconfig.base.json`, `vitest.workspace.ts`). The workspace
manifests already glob `packages/*` and `crates/*`, so just create your subdir.

## TS package template (`packages/<name>/`)

`package.json`
```json
{
  "name": "@drupaljs/<name>",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": { "test": "vitest run" }
}
```
`tsconfig.json`
```json
{ "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"] }
```
`src/index.ts` — public API. Tests live in `src/**/*.test.ts` (Vitest).

## Rust/WASM crate template (`crates/<name>/`)

`Cargo.toml`
```toml
[package]
name = "drupaljs-<name>"
version = "0.0.0"
edition.workspace = true
[lib]
crate-type = ["cdylib", "rlib"]
[dependencies]
wasm-bindgen.workspace = true
```
`src/lib.rs` uses `#[wasm_bindgen]` exports. Unit tests via `#[cfg(test)]` +
`cargo test`; build to WASM with `wasm-pack build --target web`. The consuming TS
package imports the generated `pkg/`.

## TDD (London / mock-first) — required

1. **Red**: write the failing test first against the public contract; mock
   collaborators (interfaces), assert interactions.
2. **Green**: minimal implementation to pass.
3. **Refactor**: clean up under green tests.
Every package ships tests with it; no implementation lands without a failing-first test.

## Complex algos → Rust/WASM (not TS)

Diff (Myers), HTML/Xss filter automaton, transliteration tables, dependency graph
topological sort, cache-tag checksum, route regex matcher, search tokenizer/stemmer,
password hashing. See ADR-0015.

## Commands

```bash
cd port
npm install
npm test          # vitest across all packages
npm run wasm      # build all crates to WASM
npm run build     # tsc project references
```
