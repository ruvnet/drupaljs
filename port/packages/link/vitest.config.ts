import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/link',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
