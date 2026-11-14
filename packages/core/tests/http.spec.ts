import type { FetchLike } from '@stats-forge/card-kit';
import { describe, expect, it, vi } from 'vitest';

import { getJson, USER_AGENT } from '../src/common/http.ts';

import { registry, reply, testConfig, testLogger } from './_registry.ts';

const URL = 'https://registry.example/zod';

describe(getJson, () => {
  it('names the client, which crates.io requires of every request', async () => {
    const fetch = registry(reply(URL, { ok: true }));
    await getJson(testConfig(fetch), 'npm', URL);

    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('User-Agent')).toBe(USER_AGENT);
  });

  it('hands a 404 back for the fetcher to word', async () => {
    await expect(
      getJson(testConfig(registry(reply(URL, { error: 'Not found' }, 404))), 'npm', URL),
    ).resolves.toMatchObject({ status: 404 });
  });

  it('throws a 429 as rate limiting, retryable', async () => {
    await expect(
      getJson(testConfig(registry(reply(URL, {}, 429))), 'crates.io', URL),
    ).rejects.toMatchObject({
      reason: 'registry_rate_limited',
      code: 'rate_limited',
      retryable: true,
      message: 'Downtime due to crates.io rate limiting',
    });
  });

  it('throws any other failing status as the registry being unavailable, and logs it', async () => {
    const logger = testLogger();

    await expect(
      getJson(testConfig(registry(reply(URL, {}, 503)), logger), 'npm', URL),
    ).rejects.toMatchObject({
      reason: 'registry_unavailable',
      message: 'npm answered with HTTP 503',
    });
    expect(logger.error).toHaveBeenCalledWith(`npm answered 503 for ${URL}`);
  });

  it('throws a transport failure as the registry being unreachable, keeping the cause', async () => {
    const cause = new TypeError('fetch failed');
    const fetch = vi.fn<FetchLike>().mockRejectedValue(cause);

    await expect(getJson(testConfig(fetch), 'npm', URL)).rejects.toMatchObject({
      reason: 'registry_unreachable',
      code: 'upstream',
      cause,
    });
  });
});
