import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-comment',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
