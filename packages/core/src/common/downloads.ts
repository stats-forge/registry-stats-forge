/** One day's downloads, as both registries report them. */
interface DailyDownloads {
  /** `YYYY-MM-DD`, UTC. */
  day: string;
  downloads: number;
}

/**
 * Sums the latest days into whole weeks, ending on the last day reported up to `lastDay`; a week
 * the series does not reach is left out rather than drawn as a dip.
 *
 * @returns Up to `weeks` totals, oldest first.
 */
const weeklyTotals = (
  days: ReadonlyArray<DailyDownloads>,
  weeks: number,
  /** The last day the registry has finished counting, `YYYY-MM-DD`; a later one reads low. */
  lastDay: string,
): Array<number> => {
  const ordered = days
    .filter(({ day }) => day <= lastDay)
    .toSorted((a, b) => a.day.localeCompare(b.day));
  const totals: Array<number> = [];
  for (let end = ordered.length; end >= 7 && totals.length < weeks; end -= 7) {
    totals.unshift(ordered.slice(end - 7, end).reduce((sum, { downloads }) => sum + downloads, 0));
  }
  return totals;
};

const DAY_MS = 86_400_000;

/** @returns The day `daysAgo` days before today, `YYYY-MM-DD` in UTC as the registries count. */
const isoDay = (daysAgo: number): string =>
  new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10);

export { isoDay, weeklyTotals };
export type { DailyDownloads };
