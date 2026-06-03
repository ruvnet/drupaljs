import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/testing',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
