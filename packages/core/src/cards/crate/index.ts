import { icons, localize, NUMBER_FORMATS } from '@stats-forge/card-kit';

import { CARD_ICON } from '../../common/brand.ts';
import { renderPackageCard } from '../../common/package-card.ts';
import type { PackageCardOptions, PackageStat } from '../../common/package-card.ts';
import type { CrateData } from '../../fetchers/crate/types.ts';
import type { CardOptions } from '../options.ts';

import { crateCardLocales } from './locales.ts';

/** What `hide` can leave out: the description, the chart, or a row. */
const CRATE_HIDE = [
  'description',
  'chart',
  'version',
  'recent_downloads',
  'downloads',
  'versions',
  'license',
  'msrv',
] as const;
type CrateHidden = (typeof CRATE_HIDE)[number];

interface CrateCardOptions extends PackageCardOptions {
  hide: Array<CrateHidden>;
}

/**
 * Renders a crate's card.
 *
 * @returns The card's SVG.
 */
const renderCard = (data: CrateData, options: CardOptions<CrateCardOptions> = {}): string => {
  const { hide = [], locale } = options;
  const t = localize(crateCardLocales, locale);
  // typed against the exported list, so a part drawn here cannot be missing from it
  const hides = (part: CrateHidden): boolean => hide.includes(part);

  const stats: Array<PackageStat> = [];
  if (!hides('version')) {
    stats.push({ id: 'version', icon: icons.tag, label: t.version(), value: data.version });
  }
  if (!hides('recent_downloads')) {
    stats.push({
      id: 'recent_downloads',
      icon: icons.pulse,
      label: t.recentDownloads(),
      value: data.recentDownloads,
    });
  }
  if (!hides('downloads')) {
    stats.push({ id: 'downloads', icon: icons.star, label: t.downloads(), value: data.downloads });
  }
  if (!hides('versions')) {
    stats.push({ id: 'versions', icon: icons.commits, label: t.versions(), value: data.versions });
  }
  if (!hides('license') && data.license !== undefined) {
    stats.push({ id: 'license', icon: icons.repo, label: t.license(), value: data.license });
  }
  if (!hides('msrv') && data.msrv !== undefined) {
    stats.push({ id: 'msrv', icon: icons.code, label: t.msrv(), value: data.msrv });
  }

  return renderPackageCard(
    {
      title: data.name,
      titleIcon: CARD_ICON.crate,
      version: data.version,
      description: data.description ?? t.noDescription(),
      weeks: data.weeks,
      chartLabel: t.chart({ count: data.weeks.length }),
      stats,
    },
    options,
    { description: hides('description'), chart: hides('chart') },
  );
};

/** The card, and the values each of its options accepts, keyed by the option's own name. */
const renderCrateCard = Object.assign(renderCard, {
  OPTIONS: {
    hide: CRATE_HIDE,
    number_format: NUMBER_FORMATS,
  },
});

export { renderCrateCard };
