import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    include: ['./tests/*.spec.ts'],
  },
  // core's TypeScript rather than its build, so a stale `build/` cannot decide a test
  resolve: { conditions: ['@stats/source'] },
  ssr: { resolve: { conditions: ['@stats/source'] } },
});
