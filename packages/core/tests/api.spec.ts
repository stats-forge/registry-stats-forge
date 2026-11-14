import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { crate, npm } from '../src/api/index.ts';
import type { ApiError, ApiResult } from '../src/api/index.ts';
import type { CrateResponse } from '../src/fetchers/crate/types.ts';
import type { DownloadsRange, LatestManifest } from '../src/fetchers/npm/types.ts';

import { NOW, registry, reply, testConfig } from './_registry.ts';

const NPM = registry(
  reply('https://registry.npmjs.org/zod/latest', { version: '4.6.7' } satisfies LatestManifest),
  reply('https://api.npmjs.org/downloads/range/2026-08-21:2026-11-12/zod', {
    downloads: [],
  } satisfies DownloadsRange),
);

const CRATES = registry(
  reply('https://crates.io/api/v1/crates/serde?include=default_version,downloads', {
    crate: {
      name: 'serde',
      description: null,
      downloads: 1,
      recent_downloads: 1,
      num_versions: 1,
      default_version: '1.0.0',
    },
  } satisfies CrateResponse),
  reply('https://crates.io/api/v1/crates/serde/downloads', {}, 404),
);

/** @returns The error a failed result carries, failing the test on a success. */
const errorOf = (result: ApiResult): ApiError => {
  if (result.status !== 'error') {
    throw new Error('expected the request to fail');
  }
  return result.error;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe(npm, () => {
  it('draws the package named', async () => {
    const result = await npm({ package: 'zod', theme: 'ember_dark' }, testConfig(NPM));

    expect(result).toMatchObject({ status: 'success' });
    expect(result.status === 'success' && result.content).toContain('4.6.7');
  });

  it('asks for a package when none is named', async () => {
    expect(errorOf(await npm({}, testConfig(NPM)))).toMatchObject({
      code: 'missing_param',
      param: 'package',
    });
  });

  it('refuses a malformed name before sending anything', async () => {
    const fetch = registry();

    const error = errorOf(await npm({ package: 'Not A Name' }, testConfig(fetch)));

    expect(error).toMatchObject({ code: 'invalid_param', param: 'package' });
    expect(error.text).toContain('Invalid npm package name for parameter "package"');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a package the deployment does not serve', async () => {
    const config = testConfig(NPM).with({ npmAllowlist: ['react'] });

    expect(errorOf(await npm({ package: 'zod' }, config))).toMatchObject({ code: 'not_allowed' });
  });
});

describe(crate, () => {
  it('draws the crate named', async () => {
    await expect(crate({ crate: 'serde' }, testConfig(CRATES))).resolves.toMatchObject({
      status: 'success',
    });
  });

  it('guards crates with their own list', async () => {
    const config = testConfig(CRATES).with({ npmAllowlist: ['zod'], crateAllowlist: ['tokio'] });

    expect(errorOf(await crate({ crate: 'serde' }, config))).toMatchObject({ code: 'not_allowed' });
  });

  it('refuses a card width it cannot lay out', async () => {
    expect(
      errorOf(await crate({ crate: 'serde', card_width: '50' }, testConfig(CRATES))),
    ).toMatchObject({ code: 'invalid_param', param: 'card_width' });
  });
});
