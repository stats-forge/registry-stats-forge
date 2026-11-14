import { afterEach, describe, expect, it, vi } from 'vitest';

import { isoDay, weeklyTotals } from '../src/common/downloads.ts';

import { days, NOW } from './_registry.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe(weeklyTotals, () => {
  it('sums whole weeks ending on the last day, oldest first', () => {
    expect(
      weeklyTotals(
        days('2026-11-13', 14, (index) => index),
        2,
        '2026-11-13',
      ),
    ).toStrictEqual([21, 70]);
  });

  it('reads the days in date order whatever order they came in', () => {
    const series = days('2026-11-13', 14, (index) => index).toReversed();

    expect(weeklyTotals(series, 2, '2026-11-13')).toStrictEqual([21, 70]);
  });

  it('ignores a day the registry has not finished counting', () => {
    const series = [...days('2026-11-13', 7), { day: '2026-11-14', downloads: 1000 }];

    expect(weeklyTotals(series, 1, '2026-11-13')).toStrictEqual([7]);
  });

  it('leaves out a week the series does not reach whole', () => {
    expect(weeklyTotals(days('2026-11-13', 10), 12, '2026-11-13')).toStrictEqual([7]);
  });

  it('keeps only the latest weeks asked for', () => {
    expect(weeklyTotals(days('2026-11-13', 28), 2, '2026-11-13')).toHaveLength(2);
  });

  it('has no weeks to draw from no days', () => {
    expect(weeklyTotals([], 12, '2026-11-13')).toStrictEqual([]);
  });
});

describe(isoDay, () => {
  it('counts back whole days from today in UTC', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    expect(isoDay(0)).toBe('2026-11-14');
    expect(isoDay(2)).toBe('2026-11-12');
  });
});
