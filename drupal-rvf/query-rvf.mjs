/**
 * Semantic query over the Drupal RVF cognitive container.
 *
 * Usage:
 *   node query-rvf.mjs "how does the cache backend invalidation work" [k]
 *
 * Embeds the query with the same ONNX MiniLM-L6-v2 model, runs a k-NN search
 * against drupal.rvf, then joins hits with drupal-catalog.jsonl for a
 * human-readable view (path, kind, module, symbols, summary).
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);

const NM = path.resolve('..', 'node_modules');
const onnx = require(path.join(NM, 'ruvector/dist/core/onnx-embedder.js'));
const { RvfDatabase } = require(path.join(NM, '@ruvector/rvf/dist/index.js'));

const query = process.argv[2];
const k = parseInt(process.argv[3] || '10', 10);
if (!query) { console.error('Usage: node query-rvf.mjs "<query>" [k]'); process.exit(1); }

// load catalog into an id->record map
const catalog = new Map();
for (const line of fs.readFileSync(path.resolve('drupal-catalog.jsonl'), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  catalog.set(r.id, r);
}

await onnx.initOnnxEmbedder({ enableParallel: false, maxLength: 128 });
const { embedding } = await onnx.embed(query);

const db = await RvfDatabase.openReadonly(path.resolve('drupal.rvf'));
const hits = await db.query(embedding, k, { efSearch: 200 });

console.log(`\nQuery: "${query}"  (top ${k})\n`);
hits.forEach((h, i) => {
  const r = catalog.get(h.id) || {};
  const sim = (1 - h.distance).toFixed(3);
  console.log(`${String(i + 1).padStart(2)}. sim=${sim}  ${r.path || '(id ' + h.id + ')'}`);
  const meta = [r.kind, r.module ? 'module:' + r.module : null].filter(Boolean).join('  ');
  if (meta) console.log(`    ${meta}`);
  if (r.summary) console.log(`    ${r.summary}`);
  if (r.symbols && r.symbols.length) console.log(`    symbols: ${r.symbols.slice(0, 10).join(', ')}`);
});
console.log();

try { await db.close(); } catch {}
try { await onnx.shutdown(); } catch {}
process.exit(0);
