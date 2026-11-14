import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // a project does not inherit this file, so each sets the `@registry-stats-forge/source` condition it needs
    projects: ['packages/core/vitest.config.ts', 'packages/cli/vitest.config.ts'],
  },
});
