import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@drupaljs/event-dispatcher',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
