import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/typed-data',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
