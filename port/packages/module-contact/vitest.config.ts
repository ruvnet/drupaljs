import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-contact',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
