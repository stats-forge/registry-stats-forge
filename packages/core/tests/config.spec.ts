import type { FetchLike } from '@stats-forge/card-kit';
import { describe, expect, it, vi } from 'vitest';

import { CardConfig } from '../src/common/config.ts';

describe(CardConfig, () => {
  it('reads each allowlist from the environment, trimming and dropping empty entries', () => {
    const config = CardConfig.fromEnv({
      NPM_ALLOWLIST: ' zod, ,@types/node ',
      CRATE_ALLOWLIST: '',
    });

    expect(config.npmAllowlist).toStrictEqual(['zod', '@types/node']);
    expect(config.crateAllowlist).toBeUndefined();
  });

  it('serves anything when no list is set', () => {
    expect(new CardConfig().isAllowed('anything', 'crate')).toBe(true);
  });

  it('matches a list case-insensitively, and only the list of that kind', () => {
    const config = new CardConfig({ npmAllowlist: ['Zod'] });

    expect(config.isAllowed('zod', 'npm')).toBe(true);
    expect(config.isAllowed('react', 'npm')).toBe(false);
    expect(config.isAllowed('react', 'crate')).toBe(true);
  });

  it('keeps everything a copy does not override, wrapping the transport once', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(new Response('{}'));
    const copy = new CardConfig({ fetch, npmAllowlist: ['zod'], requestTimeoutMs: 1000 }).with({
      crateAllowlist: ['serde'],
    });
    await copy.fetch('https://example.com');

    expect(copy.npmAllowlist).toStrictEqual(['zod']);
    expect(copy.crateAllowlist).toStrictEqual(['serde']);
    expect(copy.requestTimeoutMs).toBe(1000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
