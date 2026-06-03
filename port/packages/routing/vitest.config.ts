import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/routing',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
