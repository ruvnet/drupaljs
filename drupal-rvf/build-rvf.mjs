/**
 * Build a detailed RVF cognitive container of the latest Drupal core.
 *
 * Pipeline: walk -> classify -> extract symbols -> embed (ONNX MiniLM-L6-v2)
 *           -> ingest into .rvf (vectors + flat metadata)
 *           -> write sidecar catalog (rich, per-id) + manifest (aggregate).
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);

const ROOT = path.resolve('drupal-core');
const STORE = path.resolve('drupal.rvf');
const CATALOG = path.resolve('drupal-catalog.jsonl');
const MANIFEST = path.resolve('drupal-manifest.json');
const DIM = 384;

// Local packages (installed in the parent project's node_modules)
const NM = path.resolve('..', 'node_modules');
const onnx = require(path.join(NM, 'ruvector/dist/core/onnx-embedder.js'));
const { RvfDatabase } = require(path.join(NM, '@ruvector/rvf/dist/index.js'));

// ---------- file selection ----------
const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor']);
const EXT_OK = new Set(['php', 'module', 'inc', 'install', 'theme', 'engine', 'profile', 'yml', 'twig', 'js']);
const MAX_BYTES = 800 * 1024;

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), out);
    } else if (ent.isFile()) {
      const ext = ent.name.split('.').pop().toLowerCase();
      if (!EXT_OK.has(ext)) continue;
      if (ent.name.endsWith('.min.js')) continue;
      const full = path.join(dir, ent.name);
      if (full.replace(/\\/g, '/').match(/\/(assets\/vendor|js\/vendor)\//)) continue;
      out.push(full);
    }
  }
  return out;
}

// ---------- classification + symbol extraction ----------
function classify(rel, name, ext, content) {
  const segs = rel.split('/');
  let area = segs.slice(0, 2).join('/') || segs[0];
  let module = '';
  if (segs[0] === 'core' && (segs[1] === 'modules' || segs[1] === 'themes' || segs[1] === 'profiles')) {
    module = segs[2] || '';
  }
  let kind;
  if (ext === 'twig') kind = 'template';
  else if (ext === 'js') kind = 'javascript';
  else if (ext === 'yml') {
    if (name.endsWith('.services.yml')) kind = 'service-definitions';
    else if (name.endsWith('.routing.yml')) kind = 'routes';
    else if (name.endsWith('.permissions.yml')) kind = 'permissions';
    else if (name.endsWith('.info.yml')) kind = 'extension-info';
    else if (name.endsWith('.libraries.yml')) kind = 'asset-libraries';
    else if (/\.links\.(menu|task|action|contextual)\.yml$/.test(name)) kind = 'menu-links';
    else if (rel.includes('/config/schema/')) kind = 'config-schema';
    else if (rel.includes('/config/install/') || rel.includes('/config/optional/')) kind = 'config-default';
    else kind = 'config-yaml';
  } else if (['module', 'inc', 'install', 'theme', 'engine', 'profile'].includes(ext)) {
    kind = 'procedural-php';
  } else { // php
    if (/\bclass\s+\w*Test\b/.test(content) || rel.includes('/tests/')) kind = 'php-test';
    else if (/\binterface\s+\w+/.test(content)) kind = 'php-interface';
    else if (/\btrait\s+\w+/.test(content)) kind = 'php-trait';
    else if (/\bclass\s+\w+/.test(content)) kind = 'php-class';
    else kind = 'php-file';
  }
  return { area, module, kind };
}

function uniq(arr, cap) {
  const s = []; const seen = new Set();
  for (const x of arr) { if (x && !seen.has(x)) { seen.add(x); s.push(x); if (s.length >= cap) break; } }
  return s;
}

function extractSymbols(ext, content) {
  const syms = [];
  let ns = '';
  let docs = '';
  const grab = (re, cap) => { let m, c = 0; while ((m = re.exec(content)) && c < cap) { syms.push(m[1]); c++; } };
  if (ext === 'php' || ['module', 'inc', 'install', 'theme', 'engine', 'profile'].includes(ext)) {
    const nm = content.match(/^namespace\s+([^;]+);/m); if (nm) ns = nm[1].trim();
    grab(/\b(?:final\s+|abstract\s+)?class\s+([A-Za-z_]\w*)/g, 8);
    grab(/\binterface\s+([A-Za-z_]\w*)/g, 8);
    grab(/\btrait\s+([A-Za-z_]\w*)/g, 8);
    grab(/\bfunction\s+([A-Za-z_]\w*)\s*\(/g, 30);
    const ann = content.match(/@([A-Z]\w+)\s*\(/); if (ann) syms.unshift('@' + ann[1]);
    const db = content.match(/\/\*\*\s*\n\s*\*\s*(.+)/); if (db) docs = db[1].trim();
  } else if (ext === 'yml') {
    grab(/^([A-Za-z][\w.]*):/gm, 25);             // top-level keys (service/route/config ids)
    grab(/^\s*class:\s*([\\\w]+)/gm, 15);          // service classes
    const nm = content.match(/^name:\s*['"]?(.+?)['"]?\s*$/m); if (nm) docs = nm[1].trim();
    const ty = content.match(/^type:\s*(.+)$/m); if (ty) docs += (docs ? ' | ' : '') + 'type: ' + ty[1].trim();
  } else if (ext === 'twig') {
    const c = content.match(/\{#\s*([\s\S]*?)#\}/); if (c) docs = c[1].trim().split('\n')[0].slice(0, 160);
    grab(/\{%\s*(?:block|embed|include|extends)\s+['"]?([\w./-]+)/g, 12);
  } else if (ext === 'js') {
    grab(/Drupal\.behaviors\.(\w+)/g, 10);
    grab(/(?:function|const|class)\s+([A-Za-z_]\w*)/g, 15);
    const c = content.match(/\/\*\*?\s*\n?\s*\*?\s*(.+)/); if (c) docs = c[1].trim().slice(0, 160);
  }
  return { ns, symbols: uniq(syms, 24), docs: docs.slice(0, 200) };
}

function buildText(rec) {
  const parts = [
    `[${rec.kind}] ${rec.relPath}`,
    rec.module ? `module: ${rec.module}` : null,
    `area: ${rec.area}`,
    rec.ns ? `namespace: ${rec.ns}` : null,
    rec.docs ? `summary: ${rec.docs}` : null,
    rec.symbols.length ? `symbols: ${rec.symbols.join(', ')}` : null,
    '---',
    rec.snippet,
  ].filter(Boolean);
  return parts.join('\n').slice(0, 600);
}

// ---------- main ----------
const t0 = Date.now();
console.log('Walking', ROOT);
const files = walk(ROOT, []);
console.log('Candidate files:', files.length);

const records = [];
let skipped = 0;
for (const full of files) {
  let st;
  try { st = fs.statSync(full); } catch { skipped++; continue; }
  if (st.size > MAX_BYTES || st.size === 0) { skipped++; continue; }
  let content;
  try { content = fs.readFileSync(full, 'utf8'); } catch { skipped++; continue; }
  if (/\x00/.test(content)) { skipped++; continue; } // binary guard (NUL byte)
  const rel = path.relative(ROOT, full).replace(/\\/g, '/');
  const name = path.basename(full);
  const ext = name.split('.').pop().toLowerCase();
  const { area, module, kind } = classify(rel, name, ext, content);
  const { ns, symbols, docs } = extractSymbols(ext, content);
  const loc = content.split('\n').length;
  const snippet = content.replace(/^﻿/, '').slice(0, 350);
  records.push({ relPath: rel, name, ext, area, module, kind, ns, symbols, docs, loc, snippet });
}
console.log('Parsed records:', records.length, '| skipped:', skipped, '| parse ms:', Date.now() - t0);

// init embedder
console.log('Initializing ONNX embedder...');
await onnx.initOnnxEmbedder({ enableParallel: false, maxLength: 128 });
console.log('Embedder stats:', JSON.stringify(onnx.getStats()));

// create fresh store
if (fs.existsSync(STORE)) fs.rmSync(STORE);
const db = await RvfDatabase.create(STORE, { dimensions: DIM, metric: 'cosine' });

// embed + ingest in batches
const catStream = fs.createWriteStream(CATALOG, { flags: 'w' });
const BATCH = 256;
let ingested = 0, rejected = 0, id = 0;
const tEmbed = Date.now();
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const texts = batch.map(buildText);
  const res = await onnx.embedBatch(texts);
  const entries = [];
  for (let j = 0; j < batch.length; j++) {
    id++;
    const r = batch[j];
    const sid = String(id);
    entries.push({
      id: sid,
      vector: res[j].embedding,
      metadata: {
        kind: r.kind,
        ext: r.ext,
        area: r.area,
        module: r.module || '',
        loc: r.loc,
      },
    });
    catStream.write(JSON.stringify({
      id: sid, path: r.relPath, kind: r.kind, ext: r.ext, area: r.area,
      module: r.module, namespace: r.ns, loc: r.loc, summary: r.docs, symbols: r.symbols,
    }) + '\n');
  }
  const out = await db.ingestBatch(entries);
  ingested += out.accepted; rejected += out.rejected;
  if (i % (BATCH * 8) === 0 || i + BATCH >= records.length) {
    const pct = Math.min(100, Math.round(((i + batch.length) / records.length) * 100));
    console.log(`  ${pct}%  ingested=${ingested} rejected=${rejected}  (${Date.now() - tEmbed}ms)`);
  }
}
catStream.end();
const status = await db.status();
await db.close();
try { await onnx.shutdown(); } catch {}

// ---------- aggregate manifest ----------
const by = (key) => {
  const m = {};
  for (const r of records) { const k = r[key] || '(none)'; m[k] = (m[k] || 0) + 1; }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
};
const totalLoc = records.reduce((s, r) => s + r.loc, 0);
const moduleCounts = by('module'); delete moduleCounts['(none)']; delete moduleCounts[''];
const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'Drupal core (git.drupalcode.org project/drupal, branch 11.x, shallow clone)',
  embedder: 'all-MiniLM-L6-v2 (ONNX WASM, 384-dim, cosine)',
  store: path.basename(STORE),
  catalog: path.basename(CATALOG),
  totals: {
    filesScanned: files.length,
    vectorsIngested: ingested,
    rejected,
    skipped,
    totalLinesOfCode: totalLoc,
    storeBytes: status.fileSizeBytes,
    segments: status.totalSegments,
  },
  byKind: by('kind'),
  byArea: by('area'),
  byExtension: by('ext'),
  topModules: Object.fromEntries(Object.entries(moduleCounts).slice(0, 30)),
  moduleCount: Object.keys(moduleCounts).length,
};
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log('\n=== DONE ===');
console.log('store status:', JSON.stringify(status));
console.log('manifest:', MANIFEST);
console.log('total ms:', Date.now() - t0);
