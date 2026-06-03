import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-dynamic_page_cache',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
