import { screen } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';

import { renderCrateCard } from '../src/cards/crate/index.ts';
import type { CrateData } from '../src/fetchers/crate/types.ts';

import { draw, exactly } from './_card.ts';

const SERDE: CrateData = {
  name: 'serde',
  version: '1.0.229',
  description: 'A generic serialization/deserialization framework',
  license: 'MIT OR Apache-2.0',
  downloads: 1_706_650_465,
  recentDownloads: 431_884_698,
  versions: 316,
  msrv: '1.56',
  weeks: Array.from({ length: 12 }, () => 36_000_000),
};

describe(renderCrateCard, () => {
  it('draws a row a stat, the counts abbreviated', () => {
    draw(renderCrateCard(SERDE));

    expect(screen.getByTestId('header')).toHaveTextContent(exactly('serde'));
    expect(screen.getAllByTestId('week')).toHaveLength(12);
    expect(screen.getByTestId('version')).toHaveTextContent(exactly('1.0.229'));
    expect(screen.getByTestId('recent_downloads')).toHaveTextContent(exactly('431.9M'));
    expect(screen.getByTestId('downloads')).toHaveTextContent(exactly('1.7B'));
    expect(screen.getByTestId('versions')).toHaveTextContent(exactly('316'));
    expect(screen.getByTestId('license')).toHaveTextContent(exactly('MIT OR Apache-2.0'));
    expect(screen.getByTestId('msrv')).toHaveTextContent(exactly('1.56'));
  });

  it('leaves out what `hide` names, and what the version does not declare', () => {
    draw(
      renderCrateCard(
        { ...SERDE, msrv: undefined },
        { hide: ['downloads', 'versions', 'license'] },
      ),
    );

    for (const id of ['downloads', 'versions', 'license', 'msrv']) {
      expect(screen.queryAllByTestId(id)).toHaveLength(0);
    }
    expect(screen.getByTestId('recent_downloads')).toBeInTheDocument();
  });

  it('draws no chart without weeks, and grows no taller for it', () => {
    const withChart = draw(renderCrateCard(SERDE)).getAttribute('height');
    const without = draw(renderCrateCard({ ...SERDE, weeks: [] }));

    expect(screen.queryAllByTestId('downloads-chart')).toHaveLength(0);
    expect(Number(without.getAttribute('height'))).toBeLessThan(Number(withChart));
  });

  it('takes a title of its own over the crate name', () => {
    draw(renderCrateCard(SERDE, { title: 'Serde' }));

    expect(screen.getByTestId('header')).toHaveTextContent(exactly('Serde'));
  });
});
