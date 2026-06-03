/**
 * Build every Rust crate under crates/* to WASM via wasm-pack.
 * Output lands in crates/<name>/pkg and is symlinked/copied into the consuming
 * TS package's wasm/ dir by that package's own build step.
 */
import { readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cratesDir = path.join(root, 'crates');
if (!existsSync(cratesDir)) { console.log('no crates/ yet'); process.exit(0); }

const crates = readdirSync(cratesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(cratesDir, d.name, 'Cargo.toml')))
  .map((d) => d.name);

if (!crates.length) { console.log('no crates to build'); process.exit(0); }
console.log('Building WASM crates:', crates.join(', '));
for (const c of crates) {
  const dir = path.join(cratesDir, c);
  console.log(`\n== wasm-pack build ${c} ==`);
  execSync('wasm-pack build --target web --out-dir pkg', { cwd: dir, stdio: 'inherit' });
}
