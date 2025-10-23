import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    dir: 'tests',
    setupFiles: ['tests/setup/test-environment.ts'],
    hookTimeout: 120000,
    testTimeout: 120000,
    fileParallelism: false,
    coverage: {
      reporter: ['text', 'lcov'],
      enabled: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'deploy/**',
        '**/*.js',
        'tests/**',
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
      ],
      thresholds: {
        branches: 98,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
