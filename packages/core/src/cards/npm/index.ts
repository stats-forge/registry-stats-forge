import { formatBytes, icons, localize, NUMBER_FORMATS } from '@stats-forge/card-kit';

import { CARD_ICON } from '../../common/brand.ts';
import { renderPackageCard } from '../../common/package-card.ts';
import type { PackageCardOptions, PackageStat } from '../../common/package-card.ts';
import type { NpmPackageData } from '../../fetchers/npm/types.ts';
import type { CardOptions } from '../options.ts';

import { npmCardLocales } from './locales.ts';

/** What `hide` can leave out: the description, the chart, or a row. */
const NPM_HIDE = [
  'description',
  'chart',
  'version',
  'weekly_downloads',
  'dependencies',
  'size',
  'license',
] as const;
type NpmHidden = (typeof NPM_HIDE)[number];

interface NpmCardOptions extends PackageCardOptions {
  hide: Array<NpmHidden>;
}

/**
 * Renders an npm package's card.
 *
 * @returns The card's SVG.
 */
const renderCard = (data: NpmPackageData, options: CardOptions<NpmCardOptions> = {}): string => {
  const { hide = [], locale } = options;
  const t = localize(npmCardLocales, locale);
  // typed against the exported list, so a part drawn here cannot be missing from it
  const hides = (part: NpmHidden): boolean => hide.includes(part);

  const stats: Array<PackageStat> = [];
  if (!hides('version')) {
    stats.push({ id: 'version', icon: icons.tag, label: t.version(), value: data.version });
  }
  if (!hides('weekly_downloads')) {
    stats.push({
      id: 'weekly_downloads',
      icon: icons.pulse,
      label: t.weeklyDownloads(),
      value: data.weeklyDownloads,
    });
  }
  if (!hides('dependencies')) {
    stats.push({
      id: 'dependencies',
      icon: icons.fork,
      label: t.dependencies(),
      value: data.dependencies,
    });
  }
  if (!hides('size') && data.unpackedSize !== undefined) {
    stats.push({
      id: 'size',
      icon: icons.code,
      label: t.size(),
      value: formatBytes(data.unpackedSize, locale),
    });
  }
  if (!hides('license') && data.license !== undefined) {
    stats.push({ id: 'license', icon: icons.repo, label: t.license(), value: data.license });
  }

  return renderPackageCard(
    {
      title: data.name,
      titleIcon: CARD_ICON.npm,
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
const renderNpmCard = Object.assign(renderCard, {
  OPTIONS: {
    hide: NPM_HIDE,
    number_format: NUMBER_FORMATS,
  },
});

export { renderNpmCard };
