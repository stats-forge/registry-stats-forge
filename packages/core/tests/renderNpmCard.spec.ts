import { CARD_STYLE } from '@stats-forge/card-kit';
import { screen } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';

import { renderNpmCard } from '../src/cards/npm/index.ts';
import type { NpmPackageData } from '../src/fetchers/npm/types.ts';

import { draw, exactly } from './_card.ts';

/** @returns Where `node` sits across the card: its `x` plus every enclosing translation. */
const cardX = (node: Element): number => {
  let x = Number(node.getAttribute('x') ?? 0);
  for (let group = node.parentElement; group; group = group.parentElement) {
    const shift = /translate\((?<dx>[\d.-]+)/u.exec(group.getAttribute('transform') ?? '');
    x += Number(shift?.groups?.['dx'] ?? 0);
  }
  return x;
};

const ZOD: NpmPackageData = {
  name: 'zod',
  version: '4.6.7',
  description: 'TypeScript-first schema declaration and validation library',
  license: 'MIT',
  dependencies: 0,
  unpackedSize: 6_186_598,
  weeklyDownloads: 453_368_999,
  weeks: [...Array.from({ length: 11 }, () => 400_000_000), 453_368_999],
};

describe(renderNpmCard, () => {
  it('draws the name, the description, a bar a week and a row a stat', () => {
    draw(renderNpmCard(ZOD));

    expect(screen.getByTestId('header')).toHaveTextContent(exactly('zod'));
    expect(screen.getByTestId('description')).toHaveTextContent(ZOD.description ?? '');
    expect(screen.getAllByTestId('week')).toHaveLength(12);
    expect(screen.getByTestId('version')).toHaveTextContent(exactly('4.6.7'));
    expect(screen.getByTestId('weekly_downloads')).toHaveTextContent(exactly('453.4M'));
    expect(screen.getByTestId('dependencies')).toHaveTextContent(exactly('0'));
    expect(screen.getByTestId('size')).toHaveTextContent(exactly('5.9 MB'));
    expect(screen.getByTestId('license')).toHaveTextContent(exactly('MIT'));
  });

  it('scales the bars to the busiest week, keeping a sliver for a quiet one', () => {
    draw(renderNpmCard({ ...ZOD, weeks: [0, 1, 1000] }));
    const [none, quiet, busiest] = screen.getAllByTestId('week');

    expect(none).toHaveAttribute('height', '0');
    expect(quiet).toHaveAttribute('height', '2');
    expect(busiest).toHaveAttribute('height', '36');
  });

  it('leaves out what `hide` names, and a row with nothing to say', () => {
    draw(
      renderNpmCard(
        { ...ZOD, license: undefined, unpackedSize: undefined },
        { hide: ['description', 'chart', 'dependencies'] },
      ),
    );

    expect(screen.queryAllByTestId('description')).toHaveLength(0);
    expect(screen.queryAllByTestId('downloads-chart')).toHaveLength(0);
    expect(screen.queryAllByTestId('dependencies')).toHaveLength(0);
    expect(screen.queryAllByTestId('license')).toHaveLength(0);
    expect(screen.queryAllByTestId('size')).toHaveLength(0);
    expect(screen.getByTestId('version')).toBeInTheDocument();
  });

  it('says so when the package has no description', () => {
    draw(renderNpmCard({ ...ZOD, description: undefined }));

    expect(screen.getByTestId('description')).toHaveTextContent(exactly('No description provided'));
  });

  it('writes the whole count for `number_format=long`', () => {
    draw(renderNpmCard(ZOD, { number_format: 'long' }));

    expect(screen.getByTestId('weekly_downloads')).toHaveTextContent(exactly('453368999'));
  });

  it('anchors each value at the inner right edge, never past the card', () => {
    const svg = draw(renderNpmCard(ZOD, { card_width: 420 }));

    expect(svg).toHaveAttribute('width', '420');
    expect(cardX(screen.getByTestId('license'))).toBe(420 - CARD_STYLE.padding.x);
    expect(screen.getByTestId('license')).toHaveAttribute('text-anchor', 'end');
  });

  it('keeps the card wide enough for a row', () => {
    expect(draw(renderNpmCard(ZOD, { card_width: 100 }))).toHaveAttribute('width', '300');
  });

  it('reads the version and the stats aloud', () => {
    draw(renderNpmCard(ZOD, { hide: ['chart'] }));

    expect(document.querySelector('desc')).toHaveTextContent(
      'zod v4.6.7. TypeScript-first schema declaration and validation library Latest version: 4.6.7',
    );
  });
});
