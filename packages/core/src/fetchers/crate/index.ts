import type { CardConfig } from '../../common/config.ts';
import { isoDay, weeklyTotals } from '../../common/downloads.ts';
import type { DailyDownloads } from '../../common/downloads.ts';
import { CardError } from '../../common/error.ts';
import { getJson } from '../../common/http.ts';
import { CRATE_NAME_PATTERN } from '../../common/names.ts';

import type { CrateData, CrateDownloadsResponse, CrateResponse } from './types.ts';

const API = 'https://crates.io/api/v1/crates';

/** Weeks of downloads the card's chart draws: what crates.io's ninety days hold whole. */
const WEEKS = 12;

/** @returns One total per day, every version's downloads summed. */
const dailyTotals = ({
  version_downloads = [],
  meta,
}: CrateDownloadsResponse): Array<DailyDownloads> => {
  const byDay = new Map<string, number>();
  for (const { date, downloads } of [...version_downloads, ...(meta?.extra_downloads ?? [])]) {
    byDay.set(date, (byDay.get(date) ?? 0) + downloads);
  }
  return [...byDay].map(([day, downloads]) => ({ day, downloads }));
};

/**
 * Fetches a crate's default version and its last ninety days of downloads, in parallel.
 *
 * @throws {CardError} When the name is missing or malformed, the crate does not exist, or
 * crates.io fails.
 *
 * @returns The crate's data.
 */
const fetchCrate = async (
  { crate: name }: { crate: string | undefined },
  config: CardConfig,
): Promise<CrateData> => {
  if (!name) {
    throw CardError.because('missing_param', { params: ['crate'] });
  }
  // `./fetchers` is a public export, so the name is checked here as well as at the api boundary.
  if (!CRATE_NAME_PATTERN.test(name)) {
    throw CardError.because('invalid_param', { param: 'crate', detail: 'Invalid crate name' });
  }

  const [info, history] = await Promise.all([
    getJson<CrateResponse>(config, 'crates.io', `${API}/${name}?include=default_version,downloads`),
    getJson<CrateDownloadsResponse>(config, 'crates.io', `${API}/${name}/downloads`),
  ]);
  if (info.status === 404) {
    throw CardError.because('crate_not_found');
  }

  const { crate, versions = [] } = info.data;
  const shown = versions.find((version) => version.num === crate.default_version);
  return {
    name: crate.name,
    version: crate.default_version,
    description: crate.description?.trim() || undefined,
    license: shown?.license ?? undefined,
    downloads: crate.downloads,
    recentDownloads: crate.recent_downloads ?? 0,
    versions: crate.num_versions,
    msrv: shown?.rust_version ?? undefined,
    // crates.io reports today as far as it has counted
    weeks: history.status === 404 ? [] : weeklyTotals(dailyTotals(history.data), WEEKS, isoDay(1)),
  };
};

export { fetchCrate };
