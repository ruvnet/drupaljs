import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/di',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
