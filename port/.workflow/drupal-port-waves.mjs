export const meta = {
  name: 'drupal-port-waves',
  description: 'Stabilize fixes + build remaining Drupal port packages/crates (TDD-London, one dir per agent, structured output)',
  phases: [
    { title: 'Stabilize', detail: 'reconcile contracts, fix lock, implement 6 empty crates' },
    { title: 'Phase2-Fields', detail: 'field API + field types + services' },
    { title: 'Phase3-Modules', detail: 'core module ports' },
    { title: 'CI', detail: 'GitHub Actions gate' },
  ],
};

const ROOT = 'C:/Users/ruv/Projects/drupaljs';

const SCHEMA = {
  type: 'object',
  additionalProperties: true,
  properties: {
    name: { type: 'string' },
    kind: { type: 'string' },
    testsPassed: { type: 'number' },
    testsTotal: { type: 'number' },
    status: { type: 'string', enum: ['done', 'partial', 'failed'] },
    notes: { type: 'string' },
  },
  required: ['name', 'status'],
};

const rules = (dir, testCmd) => `You are a CODER on the Drupal -> TypeScript/Rust-WASM port.
Repo: ${ROOT} | Monorepo: ${ROOT}/port | Tracking epic: GitHub issue ruvnet/drupaljs#4
READ ${ROOT}/port/README.md and ${ROOT}/docs/adr/ (ADR-0014,0015,0016,0017). Real Drupal 11 source: ${ROOT}/drupal-rvf/drupal-core.
Toolchain is already installed — do NOT run npm install.
OWNERSHIP (ADR-0017): you own EXACTLY ${ROOT}/port/${dir}. Create/edit files only there. NEVER edit shared root manifests (package.json, Cargo.toml, tsconfig.base.json, vitest.workspace.ts) or any other directory. Workspace globs auto-discover your dir.
If a needed @drupaljs/* type does not exist yet, define a minimal LOCAL type with a TODO marker.
TDD-London (ADR-0016): write FAILING tests first, then minimal implementation, then refactor under green.
VERIFY with: ${testCmd}  (must pass before you finish).
Then post one line to the epic: gh issue comment 4 --repo ruvnet/drupaljs --body "<one-line status with test count>"
Your final message MUST be the structured output object (name, kind, testsPassed, testsTotal, status, notes).`;

const pkg = (name, scope, dir = `packages/${name}`) =>
  `${rules(dir, `cd ${ROOT}/port && npx vitest run ${dir}`)}

TASK: Implement @drupaljs/${name.replace(/^packages\//, '')} (kind=package). ${scope}
Deliver package.json + tsconfig.json (per README template), src/index.ts (public API barrel), and colocated src/**/*.test.ts.`;

const crate = (name, scope) =>
  `${rules(`crates/${name}`, `cd ${ROOT}/port && cargo test -p drupaljs-${name}`)}

TASK: Implement the Rust crate drupaljs-${name} (kind=crate). ${scope}
crate-type=["cdylib","rlib"], wasm-bindgen exports + a plain-Rust API, #[cfg(test)] unit tests written first. wasm-pack is installed but native \`cargo test\` is the required gate.`;

// ---------------- PHASE 1: STABILIZE ----------------
phase('Stabilize');
const stabilizeThunks = [
  () => agent(`${rules('packages/contracts', `cd ${ROOT}/port && npx vitest run packages/contracts packages/cache packages/di`)}

TASK: RECONCILE @drupaljs/contracts. The barrel has early cache/DI interface sketches that diverge from the Drupal-faithful implementations in packages/cache and packages/di. Canonicalize them: cache must have allowInvalid, setMultiple keyed-by-cid, integer checksums, removeBin, and drop deprecated invalidateAll; DI reference style must match packages/di. Keep ALL existing export names stable (additive/shape-fix only). Then run the listed tests to confirm contracts, cache, and di are all still green.`,
    { schema: SCHEMA, phase: 'Stabilize', label: 'reconcile:contracts', agentType: 'coder' }),
  () => agent(`${rules('packages/lock', `cd ${ROOT}/port && npx vitest run packages/lock`)}

TASK: FIX the 2 failing tests in packages/lock/src/lock.test.ts. Correct MemoryLockBackend semantics: a lock is keyed by name and tracks its owner; the SAME owner re-acquiring (or extending) an owned lock returns true; release() and lockMayBeAvailable() by a DIFFERENT owner must be a no-op (the original owner still holds it). Make every test in the package green.`,
    { schema: SCHEMA, phase: 'Stabilize', label: 'fix:lock', agentType: 'coder' }),
  () => agent(crate('cache-checksum', 'Cache-tag checksum/invalidation, mirroring DatabaseCacheTagsChecksum: maintain per-tag invalidation counters, getCurrentChecksum(tags)=sum of counts, isValid(checksum, tags), invalidateTags(tags). wasm-bindgen exports.'),
    { schema: SCHEMA, phase: 'Stabilize', label: 'crate:cache-checksum', agentType: 'coder' }),
  () => agent(crate('crypt', "Drupal Crypt: hmacBase64(data,key) (HMAC-SHA256, url-safe base64 no padding), hashBase64(data) (SHA-256), randomBytesBase64(n), and constant-time hashEquals(a,b)."),
    { schema: SCHEMA, phase: 'Stabilize', label: 'crate:crypt', agentType: 'coder' }),
  () => agent(crate('password-hash', 'Drupal phpass-compatible portable password hashing (PhpassHashedPassword): hash(password) producing a $S$ portable hash with iterative SHA-512 stretching, check(password, hash), needsRehash(hash, countLog2). Security-correct.'),
    { schema: SCHEMA, phase: 'Stabilize', label: 'crate:password-hash', agentType: 'coder' }),
  () => agent(crate('route-matcher', 'Compiled-route regex matcher (Symfony CompiledRoute matching) pairing with @drupaljs/routing PathMatcher seam: compile(path)->{regex, variables, tokens}; match(path, compiledRoutes)->best {name, params} by static-prefix/fit. Handle optional trailing variables and requirements.'),
    { schema: SCHEMA, phase: 'Stabilize', label: 'crate:route-matcher', agentType: 'coder' }),
  () => agent(crate('transliteration', 'Drupal PhpTransliteration: transliterate(str, unknown="?", langcode) mapping Unicode to ASCII via generic + Latin-1/Latin-Extended-A tables (cover the common ranges), removeDiacritics. Deterministic.'),
    { schema: SCHEMA, phase: 'Stabilize', label: 'crate:transliteration', agentType: 'coder' }),
  () => agent(crate('uuid', 'Drupal Php Uuid: generate() RFC-4122 v4 UUID, isValid(uuid). Use a seedable RNG hook so tests are deterministic.'),
    { schema: SCHEMA, phase: 'Stabilize', label: 'crate:uuid', agentType: 'coder' }),
];
const stabilize = await parallel(stabilizeThunks);

// ---------------- PHASE 2: FIELDS / SERVICES ----------------
phase('Phase2-Fields');
const fields = [
  ['field', 'Field API: FieldItemInterface/FieldItemListInterface, FieldType base, FieldDefinition & FieldStorageDefinition, formatter & widget plugin registries (use @drupaljs/plugin). Ref core/lib/Drupal/Core/Field.'],
  ['field-ui', 'Field UI service/handlers for managing fields and entity displays (no React). Ref core/modules/field_ui.'],
  ['text', 'Text field types (text, text_long, text_with_summary) + processed-text formatter using the filter pipeline. Ref core/modules/text.'],
  ['options', 'Options field types (list_integer/list_string/list_float) with allowed-values + options provider. Ref core/modules/options.'],
  ['link', 'Link field type with URI/title + validation + formatter. Ref core/modules/link.'],
  ['datetime-field', 'Datetime field type (date/datetime) + range storage + formatters. Ref core/modules/datetime.'],
  ['path-alias', 'Path alias storage + AliasManager + AliasRepository + inbound/outbound path processors. Ref core/modules/path_alias.'],
  ['content-translation', 'Content translation handlers/metadata for translatable entities. Ref core/modules/content_translation.'],
  ['locale', 'Interface string translation storage + lookup. Ref core/modules/locale.'],
  ['editor', 'Text editor plugin + editor attachment to text formats. Ref core/modules/editor.'],
  ['filter', 'Filter/text-format processing pipeline: FilterPluginManager, FilterFormat, checkMarkup(); wire the xss-html crate / @drupaljs/util Html seam. Ref core/modules/filter.'],
];
const phase2 = await parallel(fields.map(([n, s]) =>
  () => agent(pkg(n, s), { schema: SCHEMA, phase: 'Phase2-Fields', label: `pkg:${n}`, agentType: 'coder' })));

// ---------------- PHASE 3: MODULES ----------------
phase('Phase3-Modules');
const modules = [
  'system', 'user', 'node', 'taxonomy', 'comment', 'menu_link_content', 'menu_ui',
  'block', 'block_content', 'file', 'image', 'media', 'media_library', 'path',
  'search', 'ckeditor5', 'content_moderation', 'workflows', 'workspaces',
  'layout_builder', 'layout_discovery', 'views', 'views_ui', 'jsonapi', 'rest',
  'contact', 'contextual', 'toolbar', 'big_pipe', 'dynamic_page_cache',
  'page_cache', 'breakpoint', 'responsive_image', 'migrate', 'migrate_drupal',
  'update', 'dblog', 'syslog', 'shortcut', 'book', 'history', 'tour', 'help',
];
const moduleScope = (m) => `Port the core of Drupal's '${m}' module to @drupaljs/module-${m}: its entity types / plugins / services / hook implementations (registered via @drupaljs/hook) / permissions / routes as applicable. ${m === 'views' ? 'views is large: deliver a faithful MINIMAL vertical slice — ViewExecutable, query plugin, a display plugin, and a couple of handlers — with tests; note deferred parts.' : 'Faithful but minimal vertical slice with tests; stub deep external deps with local types + TODO.'} Reference ${ROOT}/drupal-rvf/drupal-core/core/modules/${m}.`;
const phase3 = await parallel(modules.map((m) =>
  () => agent(pkg(`module-${m}`, moduleScope(m)), { schema: SCHEMA, phase: 'Phase3-Modules', label: `mod:${m}`, agentType: 'coder' })));

// ---------------- PHASE 4: CI ----------------
phase('CI');
const ci = await agent(`${rules('.github/workflows', `cd ${ROOT}/port && npx vitest run && cargo test --workspace`)}

TASK (epic #100): create a GitHub Actions workflow at ${ROOT}/.github/workflows/port-ci.yml (you own ONLY that file) that, on push/PR touching port/**, installs Node 20 + Rust stable + wasm-pack, runs (in ${ROOT}/port): npm ci, tsc -b, npx vitest run --coverage, cargo test --workspace, and npm run wasm. Cache npm + cargo. Do not edit any package.`,
  { schema: SCHEMA, phase: 'CI', label: 'ci', agentType: 'coder' });

// ---------------- RESULTS ----------------
const flat = [...stabilize, ...phase2, ...phase3, ci].filter(Boolean);
const done = flat.filter((r) => r && r.status === 'done').length;
const partial = flat.filter((r) => r && r.status === 'partial').length;
const failed = flat.filter((r) => r && r.status === 'failed').length;
log(`waves complete: ${done} done, ${partial} partial, ${failed} failed of ${flat.length}`);
return {
  summary: { total: flat.length, done, partial, failed },
  stabilize, phase2, phase3, ci,
};
