import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-layout_builder',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
