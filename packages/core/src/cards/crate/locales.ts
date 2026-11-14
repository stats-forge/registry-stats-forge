import { defineLocales } from '@stats-forge/card-kit';

/** The crate card's labels, in English until someone translates them. */
const crateCardLocales = defineLocales({
  en: {
    noDescription: 'No description provided',
    version: 'Version',
    recentDownloads: 'Downloads (90 days)',
    downloads: 'All-time downloads',
    versions: 'Releases',
    license: 'License',
    msrv: 'Minimum Rust',
    chart: {
      one: 'Downloads per week, the last week.',
      other: 'Downloads per week, the last {count} weeks.',
    },
  },
});

export { crateCardLocales };
