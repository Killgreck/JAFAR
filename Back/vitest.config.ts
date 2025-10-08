import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    dir: 'tests',
    setupFiles: ['tests/setup/test-environment.ts'],
    hookTimeout: 120000,
    testTimeout: 120000,
    coverage: {
      reporter: ['text', 'lcov'],
      enabled: true,
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
