import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/config',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
