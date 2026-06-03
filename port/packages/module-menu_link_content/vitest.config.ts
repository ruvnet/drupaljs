import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Test config for `@drupaljs/module-menu_link_content`.
 *
 * `@drupaljs/hook` is resolved via the workspace symlink, but `@drupaljs/link`
 * is not yet symlinked in the root node_modules (it was added to the workspace
 * after the last install). We alias it to its in-repo source so tests resolve
 * without touching shared root manifests or running an install.
 *
 * TODO: drop the @drupaljs/link alias once a workspace install symlinks it.
 */
export default defineConfig({
  test: {
    name: '@drupaljs/module-menu_link_content',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@drupaljs/link': fileURLToPath(new URL('../link/src/index.ts', import.meta.url)),
    },
  },
});
