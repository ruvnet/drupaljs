import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/plugin',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
