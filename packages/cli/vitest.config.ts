import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    include: ['./tests/*.spec.ts'],
    // loaded with core, so `vi.resetModules()` clears the failures core registers with it
    server: { deps: { inline: ['@stats-forge/card-kit'] } },
  },
  // core's TypeScript rather than its build, so a stale `build/` cannot decide a test
  resolve: { conditions: ['@stats/source'] },
  ssr: { resolve: { conditions: ['@stats/source'] } },
});
