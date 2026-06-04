export const meta = {
  name: 'drupal-port-finish',
  description: 'Fix module-search/module-comment + build the 23 remaining core modules (TDD-London, one dir per agent)',
  phases: [
    { title: 'Fix', detail: 'module-search missing impls + module-comment thread bug' },
    { title: 'Modules', detail: '23 remaining core module ports' },
  ],
};

const ROOT = 'C:/Users/ruv/Projects/drupaljs';

const rules = (dir, testCmd) => `You are a CODER on the Drupal -> TypeScript/Rust-WASM port.
Repo: ${ROOT} | Monorepo: ${ROOT}/port | Tracking epic: GitHub issue ruvnet/drupaljs#4
READ ${ROOT}/port/README.md and ${ROOT}/docs/adr/ (ADR-0014..0018). Real Drupal 11 source: ${ROOT}/drupal-rvf/drupal-core.
Toolchain is installed — do NOT run npm install.
OWNERSHIP (ADR-0017): you own EXACTLY ${ROOT}/port/${dir}. Create/edit files ONLY there. NEVER edit shared root manifests or any other directory.
CRITICAL: create files ONLY with the Write tool. NEVER use shell output redirection (>, >>, tee, heredocs) — a prior run polluted the tree with junk files that way. Never create loose files directly under packages/ or crates/ (only inside your own subdir).
If a needed @drupaljs/* type does not exist, define a minimal LOCAL type with a TODO.
TDD-London (ADR-0016): write FAILING tests first, then minimal implementation, then refactor under green.
VERIFY (must pass before finishing): ${testCmd}
Then post one line to the epic: gh issue comment 4 --repo ruvnet/drupaljs --body "<one-line status with test count>"
End with a short plain-text summary (no structured tool call needed): package name, tests passed/total, status.`;

const pkg = (name, scope) =>
  `${rules(`packages/${name}`, `cd ${ROOT}/port && npx vitest run packages/${name}`)}

TASK: Implement @drupaljs/${name}. ${scope}
Deliver package.json + tsconfig.json (per README template), src/index.ts barrel, and colocated src/**/*.test.ts. Ensure every import resolves to a file you actually created.`;

// ---------------- PHASE 1: FIX ----------------
phase('Fix');
const fixes = await parallel([
  () => agent(`${rules('packages/module-search', `cd ${ROOT}/port && npx vitest run packages/module-search`)}

TASK: FIX @drupaljs/module-search — 2 test files fail to load because their implementation files are missing:
- src/plugin/search-plugin.test.ts imports ./search-plugin.js (create src/plugin/search-plugin.ts)
- src/entity/search-page.test.ts imports ./search-page.js (create src/entity/search-page.ts)
Read those test files to learn the exact expected API, implement the SearchPluginInterface/SearchPluginBase and SearchPage entity to satisfy them (ref drupal-core/core/modules/search), and make the whole package green. Fix the barrel exports too.`,
    { phase: 'Fix', label: 'fix:module-search', agentType: 'coder' }),
  () => agent(`${rules('packages/module-comment', `cd ${ROOT}/port && npx vitest run packages/module-comment`)}

TASK: FIX @drupaljs/module-comment — one failing test: "places the first reply under its parent thread" expects getThread() === '01.01/' but got '01.00/'. Correct the Comment.preSave thread-placement logic (port of Comment::preSave / the {comment} thread vancode numbering): a reply's thread is the parent's thread prefix plus the next sibling vancode under that parent. Reference drupal-core/core/modules/comment/src/Entity/Comment.php. Make all tests green without weakening the test.`,
    { phase: 'Fix', label: 'fix:module-comment', agentType: 'coder' }),
]);

// ---------------- PHASE 2: REMAINING MODULES ----------------
phase('Modules');
const modules = [
  'layout_builder', 'layout_discovery', 'views', 'views_ui', 'jsonapi', 'rest',
  'contact', 'contextual', 'toolbar', 'big_pipe', 'dynamic_page_cache',
  'page_cache', 'breakpoint', 'responsive_image', 'migrate', 'migrate_drupal',
  'update', 'dblog', 'syslog', 'shortcut', 'book', 'history', 'tour', 'help',
].filter((m) => true);
const moduleScope = (m) => `Port the core of Drupal's '${m}' module to @drupaljs/module-${m}: its entity types / plugins / services / hook implementations (registered via @drupaljs/hook) / permissions / routes as applicable. ${m === 'views' ? 'views is large: deliver a faithful MINIMAL vertical slice — ViewExecutable, a query plugin, a display plugin, and a couple of handlers — with tests; note deferred parts.' : (m === 'migrate' ? 'Deliver MigrateExecutable + a source/process/destination plugin trio + Row, minimally, with tests.' : 'Faithful but minimal vertical slice with tests; stub deep external deps with local types + TODO.')} Reference ${ROOT}/drupal-rvf/drupal-core/core/modules/${m}.`;
const built = await parallel(modules.map((m) =>
  () => agent(pkg(`module-${m}`, moduleScope(m)), { phase: 'Modules', label: `mod:${m}`, agentType: 'coder' })));

log(`finish wave complete: ${fixes.filter(Boolean).length} fixes, ${built.filter(Boolean).length}/${modules.length} modules returned`);
return { fixes, modules: built.length };
