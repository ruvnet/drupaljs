import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/hook',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
