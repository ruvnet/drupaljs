import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/util',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
