import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-jsonapi',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
