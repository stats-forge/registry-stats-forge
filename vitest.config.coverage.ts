import { defineConfig, mergeConfig } from 'vitest/config';

import root from './vitest.config.ts';

export default mergeConfig(
  root,
  defineConfig({
    test: {
      coverage: {
        enabled: true,
        // every source file, so one no test imports counts as uncovered rather than unseen
        include: ['packages/*/src/**/*.ts'],
        // floors just under what each package reaches, so a drop fails CI
        thresholds: {
          'packages/core/src/**': { lines: 90, statements: 90, functions: 90, branches: 85 },
          'packages/cli/src/**': { lines: 90, statements: 90, functions: 90, branches: 85 },
        },
      },
    },
  }),
);
