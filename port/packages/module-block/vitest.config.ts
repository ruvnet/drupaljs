import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-block',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
