import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchNpmPackage } from '../src/fetchers/npm/index.ts';
import type { DownloadsRange, LatestManifest } from '../src/fetchers/npm/types.ts';

import { days, NOW, registry, reply, testConfig } from './_registry.ts';
import type { Reply } from './_registry.ts';

/** With the clock at `NOW`, npm has counted up to the day before yesterday. */
const RANGE = '2026-08-21:2026-11-12';

const manifest = (name: string, body: LatestManifest, status?: number): Reply =>
  reply(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`, body, status);

const downloads = (name: string, body: DownloadsRange): Reply =>
  reply(`https://api.npmjs.org/downloads/range/${RANGE}/${name}`, body);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe(fetchNpmPackage, () => {
  it('reads the latest version and twelve weeks of downloads', async () => {
    const fetch = registry(
      manifest('zod', {
        version: '4.6.7',
        description: 'Schemas',
        license: 'MIT',
        dependencies: { a: '1', b: '2' },
        dist: { unpackedSize: 5_900_000 },
      }),
      downloads('zod', { downloads: days('2026-11-12', 84, (index) => (index < 77 ? 1 : 10)) }),
    );

    await expect(fetchNpmPackage({ package: 'zod' }, testConfig(fetch))).resolves.toStrictEqual({
      name: 'zod',
      version: '4.6.7',
      description: 'Schemas',
      license: 'MIT',
      dependencies: 2,
      unpackedSize: 5_900_000,
      weeklyDownloads: 70,
      weeks: [...Array.from({ length: 11 }, () => 7), 70],
    });
  });

  it('escapes a scope, which the registry reads as one segment', async () => {
    const fetch = registry(
      manifest('@types/node', { version: '26.6.6' }),
      downloads('@types/node', {}),
    );
    const data = await fetchNpmPackage({ package: '@types/node' }, testConfig(fetch));

    expect(data).toMatchObject({ version: '26.6.6', dependencies: 0, weeks: [] });
  });

  it('reads a license written as an object, and leaves empty fields undefined', async () => {
    const fetch = registry(
      manifest('old', { version: '1.0.0', description: '', license: { type: 'BSD-3-Clause' } }),
      downloads('old', {}),
    );

    await expect(fetchNpmPackage({ package: 'old' }, testConfig(fetch))).resolves.toMatchObject({
      description: undefined,
      license: 'BSD-3-Clause',
      unpackedSize: undefined,
      weeklyDownloads: 0,
    });
  });

  it('throws a missing package as not found', async () => {
    const fetch = registry(manifest('nope', { version: '' }, 404), downloads('nope', {}));

    await expect(fetchNpmPackage({ package: 'nope' }, testConfig(fetch))).rejects.toMatchObject({
      reason: 'npm_package_not_found',
      code: 'not_found',
    });
  });

  it('refuses a name npm could not hold before sending anything', async () => {
    const fetch = registry();

    await expect(fetchNpmPackage({ package: '../evil' }, testConfig(fetch))).rejects.toMatchObject({
      code: 'invalid_param',
      param: 'package',
    });
    await expect(fetchNpmPackage({ package: undefined }, testConfig(fetch))).rejects.toMatchObject({
      code: 'missing_param',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
