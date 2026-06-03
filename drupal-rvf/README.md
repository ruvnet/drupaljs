# Drupal Core — RVF Cognitive Container

A semantic vector database of the **latest Drupal core (11.x)**, built with
[`ruvector`](https://www.npmjs.com/package/ruvector) in `.rvf` format. It maps,
describes, and makes the entire codebase semantically searchable.

## What's here

| File | Size | Purpose |
|------|------|---------|
| `drupal.rvf` | ~25 MB | The RVF store: 16,151 vectors (384-dim, cosine) + filterable metadata. **The DB.** |
| `drupal-catalog.jsonl` | ~5.8 MB | Sidecar catalog — one line per vector `id` with full description (path, kind, module, namespace, symbols, summary, LOC). |
| `drupal-manifest.json` | ~3 KB | Aggregate map of the codebase (counts by kind/area/module/extension, total LOC). |
| `build-rvf.mjs` | — | Pipeline that produced the store (walk → classify → extract symbols → embed → ingest). |
| `query-rvf.mjs` | — | Semantic query CLI over the store. |
| `drupal-core/` | ~158 MB | Shallow clone of `git.drupalcode.org/project/drupal` @ `11.x` (git-ignored). |

## The numbers

- **16,151** files embedded (0 rejected), **1,777,349** LOC, **87** core modules.
- Embedder: **all-MiniLM-L6-v2** (ONNX WASM, 384-dim, real semantic — not hashed).
- Each vector carries flat, filterable metadata: `kind`, `ext`, `area`, `module`, `loc`.
- Top areas: `core/modules` (10,413), `core/lib` (2,320), `core/tests` (1,920),
  `core/themes` (693), `core/profiles` (529).
- File kinds: `php-test` (6,053), `php-class` (3,996), `template` (1,063),
  `config-yaml` (1,059), `php-interface` (744), `service-definitions` (174),
  `routes` (148), `config-schema` (158), and more — see `drupal-manifest.json`.

## Query it

```bash
# from this directory
node query-rvf.mjs "how does cache tag invalidation work" 10
node query-rvf.mjs "entity access control and permissions" 5
node query-rvf.mjs "render array theme pipeline" 5
```

Output joins each k-NN hit with the catalog: similarity, path, kind, module,
summary, and top symbols.

## Rebuild from scratch

```bash
git clone --depth 1 --branch 11.x https://git.drupalcode.org/project/drupal.git drupal-core
node build-rvf.mjs        # ~40 min single-threaded (re-creates drupal.rvf + catalog + manifest)
```

## Programmatic access (RVF API)

```js
const { RvfDatabase } = require('../node_modules/@ruvector/rvf/dist/index.js');
const db = await RvfDatabase.openReadonly('drupal.rvf');
const hits = await db.query(queryVector384, 10, { efSearch: 200 });
// hits: [{ id, distance }]  -> look up id in drupal-catalog.jsonl
```

Metadata filtering (e.g. only `php-interface`, or a given `module`) is supported
via `query(vec, k, { filter })` — see `@ruvector/rvf` `RvfFilterExpr`.

## Notes

- IDs are sequential u64 strings (`"1"`..`"16151"`); join to `drupal-catalog.jsonl` for description.
- Parallel ONNX workers are unavailable in `ruvector@0.2.25` (broken export), so the
  build is single-threaded; token length was capped (`maxLength: 128`) for throughput.
- `query-rvf.mjs` opens the store read-only and ignores a benign fsync-on-close error.
