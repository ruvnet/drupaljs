import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/text',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
