import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/content-translation',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
