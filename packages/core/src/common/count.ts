/**
 * @file How the registry cards write a count. The kit's `countFormatter` stops at thousands, which
 * a registry's downloads outgrow by orders of magnitude.
 */

import { clampPrecision } from '@stats-forge/card-kit';
import type { Locale, NumberFormat } from '@stats-forge/card-kit';

/** The options that decide how a card writes a count. */
interface CountOptions {
  number_format?: NumberFormat | undefined;
  /** Decimals kept when abbreviating, clamped to 0–2; one at most when absent. */
  number_precision?: number | undefined;
  locale?: Locale | undefined;
}

/** @returns How the card writes its counts: compact (`1.2M`) unless `number_format` is `long`. */
const compactCountFormatter = ({
  number_format = 'short',
  number_precision,
  locale,
}: CountOptions): ((value: number) => string) => {
  if (number_format === 'long') {
    return String;
  }

  const precision = clampPrecision(number_precision);
  const format = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: precision ?? 1,
    minimumFractionDigits: precision ?? 0,
  });
  return (value) => format.format(value);
};

export { compactCountFormatter };
