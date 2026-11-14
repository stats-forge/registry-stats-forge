import { defineLocales } from '@stats-forge/card-kit';

/** The npm card's labels, in English until someone translates them. */
const npmCardLocales = defineLocales({
  en: {
    noDescription: 'No description provided',
    version: 'Latest version',
    weeklyDownloads: 'Weekly downloads',
    dependencies: 'Dependencies',
    size: 'Unpacked size',
    license: 'License',
    chart: {
      one: 'Downloads per week, the last week.',
      other: 'Downloads per week, the last {count} weeks.',
    },
  },
});

export { npmCardLocales };
