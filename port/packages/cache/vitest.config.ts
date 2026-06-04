import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/cache',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
