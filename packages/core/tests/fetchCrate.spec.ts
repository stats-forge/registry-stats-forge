import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchCrate } from '../src/fetchers/crate/index.ts';
import type { CrateDownloadsResponse, CrateResponse } from '../src/fetchers/crate/types.ts';

import { days, NOW, registry, reply, testConfig } from './_registry.ts';
import type { Reply } from './_registry.ts';

const API = 'https://crates.io/api/v1/crates';

const SERDE: CrateResponse = {
  crate: {
    name: 'serde',
    description: '  A generic serialization framework\n',
    downloads: 1_706_650_465,
    recent_downloads: 431_884_698,
    num_versions: 316,
    default_version: '1.0.229',
  },
  versions: [
    { num: '1.0.229', license: 'MIT OR Apache-2.0', rust_version: '1.56' },
    { num: '1.0.228', license: 'MIT', rust_version: null },
  ],
};

const info = (name: string, body: CrateResponse, status?: number): Reply =>
  reply(`${API}/${name}?include=default_version,downloads`, body, status);

const history = (name: string, body: CrateDownloadsResponse, status?: number): Reply =>
  reply(`${API}/${name}/downloads`, body, status);

/** As crates.io reports them: as `date`, not `day`. */
const dated = (
  series: ReturnType<typeof days>,
): NonNullable<CrateDownloadsResponse['version_downloads']> =>
  series.map(({ day, downloads }) => ({ date: day, downloads }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe(fetchCrate, () => {
  it('reads the default version, and sums every version per day into weeks', async () => {
    const fetch = registry(
      info('serde', SERDE),
      history('serde', {
        version_downloads: dated(days('2026-11-13', 84, () => 2)),
        // today, still being counted
        meta: {
          extra_downloads: [...dated(days('2026-11-13', 84)), { date: '2026-11-14', downloads: 9 }],
        },
      }),
    );

    await expect(fetchCrate({ crate: 'serde' }, testConfig(fetch))).resolves.toStrictEqual({
      name: 'serde',
      version: '1.0.229',
      description: 'A generic serialization framework',
      license: 'MIT OR Apache-2.0',
      downloads: 1_706_650_465,
      recentDownloads: 431_884_698,
      versions: 316,
      msrv: '1.56',
      weeks: Array.from({ length: 12 }, () => 21),
    });
  });

  it('leaves out what the default version does not declare', async () => {
    const fetch = registry(
      info('bare', {
        crate: { ...SERDE.crate, name: 'bare', description: null, recent_downloads: null },
      }),
      history('bare', {}, 404),
    );

    await expect(fetchCrate({ crate: 'bare' }, testConfig(fetch))).resolves.toMatchObject({
      description: undefined,
      license: undefined,
      msrv: undefined,
      recentDownloads: 0,
      weeks: [],
    });
  });

  it('throws a missing crate as not found', async () => {
    const fetch = registry(info('nope', SERDE, 404), history('nope', {}, 404));

    await expect(fetchCrate({ crate: 'nope' }, testConfig(fetch))).rejects.toMatchObject({
      reason: 'crate_not_found',
      code: 'not_found',
    });
  });

  it('refuses a name crates.io could not hold before sending anything', async () => {
    const fetch = registry();

    await expect(fetchCrate({ crate: 'a/b' }, testConfig(fetch))).rejects.toMatchObject({
      code: 'invalid_param',
      param: 'crate',
    });
    await expect(fetchCrate({ crate: '' }, testConfig(fetch))).rejects.toMatchObject({
      code: 'missing_param',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
