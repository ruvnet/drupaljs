import { defineConfig } from 'vitest/config';

/**
 * Test config for `@drupaljs/module-book`.
 *
 * `@drupaljs/hook` is resolved via the workspace symlink in the root
 * node_modules; no extra aliases are required for this package.
 */
export default defineConfig({
  test: {
    name: '@drupaljs/module-book',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
