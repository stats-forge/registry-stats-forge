import { describe, expect, it } from 'vitest';

import { compactCountFormatter } from '../src/common/count.ts';

describe(compactCountFormatter, () => {
  it('abbreviates past thousands, to one decimal', () => {
    const format = compactCountFormatter({});

    expect(format(999)).toBe('999');
    expect(format(1234)).toBe('1.2K');
    expect(format(453_368_999)).toBe('453.4M');
    expect(format(1_706_650_465)).toBe('1.7B');
  });

  it('keeps the decimals `number_precision` asks for, clamped to two', () => {
    expect(compactCountFormatter({ number_precision: 0 })(1_550_000)).toBe('2M');
    expect(compactCountFormatter({ number_precision: 9 })(1_000_000)).toBe('1.00M');
  });

  it('writes the whole count for `long`', () => {
    expect(compactCountFormatter({ number_format: 'long' })(453_368_999)).toBe('453368999');
  });

  it('abbreviates in the locale asked for', () => {
    expect(compactCountFormatter({ locale: 'de' })(1_500_000)).toBe('1,5 Mio.');
  });
});
