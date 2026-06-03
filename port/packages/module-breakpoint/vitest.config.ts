import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-breakpoint',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
