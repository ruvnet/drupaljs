import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/module-user',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
