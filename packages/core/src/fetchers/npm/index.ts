import type { CardConfig } from '../../common/config.ts';
import { isoDay, weeklyTotals } from '../../common/downloads.ts';
import { CardError } from '../../common/error.ts';
import { getJson } from '../../common/http.ts';
import { NPM_NAME_PATTERN } from '../../common/names.ts';

import type { DownloadsRange, LatestManifest, NpmPackageData } from './types.ts';

const REGISTRY = 'https://registry.npmjs.org';
const DOWNLOADS = 'https://api.npmjs.org/downloads/range';

/** Weeks of downloads the card's chart draws. */
const WEEKS = 12;

/** @returns The SPDX expression, from either form a manifest writes it in. */
const licenseOf = (license: LatestManifest['license']): string | undefined => {
  if (typeof license === 'string') {
    return license || undefined;
  }
  return license?.type || undefined;
};

/**
 * Fetches an npm package's latest version and its weeks of downloads, in parallel.
 *
 * @throws {CardError} When the name is missing or malformed, the package does not exist, or npm
 * fails.
 *
 * @returns The package's data.
 */
const fetchNpmPackage = async (
  { package: name }: { package: string | undefined },
  config: CardConfig,
): Promise<NpmPackageData> => {
  if (!name) {
    throw CardError.because('missing_param', { params: ['package'] });
  }
  // `./fetchers` is a public export, so the name is checked here as well as at the api boundary.
  if (!NPM_NAME_PATTERN.test(name)) {
    throw CardError.because('invalid_param', {
      param: 'package',
      detail: 'Invalid npm package name',
    });
  }

  // npm reports yesterday as 0 until it has counted it, so the range ends the day before
  const end = isoDay(2);
  const start = isoDay(2 + WEEKS * 7 - 1);
  const [manifest, range] = await Promise.all([
    getJson<LatestManifest>(config, 'npm', `${REGISTRY}/${name.replace('/', '%2F')}/latest`),
    getJson<DownloadsRange>(config, 'npm', `${DOWNLOADS}/${start}:${end}/${name}`),
  ]);
  if (manifest.status === 404) {
    throw CardError.because('npm_package_not_found');
  }

  // a package published since npm last counted has no downloads yet, which its 404 says
  const weeks = weeklyTotals(range.data.downloads ?? [], WEEKS, end);
  const { version, description, license, dependencies = {}, dist } = manifest.data;
  return {
    name,
    version,
    description: description || undefined,
    license: licenseOf(license),
    dependencies: Object.keys(dependencies).length,
    unpackedSize: dist?.unpackedSize,
    weeklyDownloads: weeks.at(-1) ?? 0,
    weeks,
  };
};

export { fetchNpmPackage };
