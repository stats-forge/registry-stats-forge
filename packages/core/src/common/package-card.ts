/**
 * @file The layout both registry cards draw: the description, a chart of weekly downloads and a
 * row per stat. Each card decides which stats it has and what they are called.
 */

import {
  CARD_STYLE,
  Card,
  HEAT_PAINT,
  clampValue,
  createTextNode,
  el,
  flexLayout,
  font,
  getLightDarkColors,
  rule,
  wrapTextMultiline,
} from '@stats-forge/card-kit';
import type { Child, CssChild, Locale, NumberFormat } from '@stats-forge/card-kit';

import type { CommonCardOptions } from '../cards/options.ts';

import { compactCountFormatter } from './count.ts';

const X_OFFSET = CARD_STYLE.padding.x;
const DESCRIPTION_FONT_SIZE = CARD_STYLE.fontSize.meta;
const DESCRIPTION_LINE_HEIGHT = Math.round(DESCRIPTION_FONT_SIZE * 1.2);
const DESCRIPTION_MAX_LINES = 3;
const DESCRIPTION_DEFAULT_LINES = 2;
const CHART_HEIGHT = 36;
const CHART_BAR_GAP = 3;
/** The air between the description, the chart and the rows. */
const SECTION_GAP = 14;
const ROW_HEIGHT = 22;
/** A row's ink is 16px tall, the icon's; the rest of `ROW_HEIGHT` is the gap below it. */
const ROW_INK = 16;
/** Narrower than this, a row's label and value collide. */
const MIN_CARD_WIDTH = CARD_STYLE.width.compact;

/** One stat row: what it is called, what it says, and the icon beside it. */
interface PackageStat {
  id: string;
  icon: Child;
  label: string;
  /** A count is formatted as the card's counts are; text is drawn as given. */
  value: number | string;
}

/** What a registry card hands the layout. */
interface PackageCardContent {
  title: string;
  titleIcon: Child;
  /** The version the card describes, for its `<desc>`; a stat row draws it. */
  version: string;
  description: string;
  /** Downloads per week, oldest first; empty draws no chart. */
  weeks: ReadonlyArray<number>;
  /** How the chart reads aloud, as the `<desc>` carries it. */
  chartLabel: string;
  stats: ReadonlyArray<PackageStat>;
}

/** The options both cards take, each card adding its own `hide`. */
interface PackageCardOptions extends CommonCardOptions {
  locale: Locale;
  disable_animations: boolean;
  hide_title: boolean;
  title: string;
  card_width: number;
  description_lines_count: number;
  show_icons: boolean;
  number_format: NumberFormat;
  number_precision: number;
}

/** @returns One bar per week, scaled to the busiest, across `width`. */
const chart = (weeks: ReadonlyArray<number>, width: number): Child => {
  const busiest = Math.max(...weeks, 1);
  const barWidth = (width - CHART_BAR_GAP * (weeks.length - 1)) / weeks.length;
  return el(
    'g',
    { 'data-testid': 'downloads-chart', class: 'chart' },
    weeks.map((downloads, index) => {
      // a week with any downloads keeps a sliver, so it never reads as none
      const height = downloads > 0 ? Math.max(2, (downloads / busiest) * CHART_HEIGHT) : 0;
      return el('rect', {
        'data-testid': 'week',
        x: Number((index * (barWidth + CHART_BAR_GAP)).toFixed(2)),
        y: Number((CHART_HEIGHT - height).toFixed(2)),
        width: Number(barWidth.toFixed(2)),
        height: Number(height.toFixed(2)),
        rx: 2,
      });
    }),
  );
};

/**
 * Draws a registry card.
 *
 * @returns The card's SVG.
 */
const renderPackageCard = (
  content: PackageCardContent,
  options: { [K in keyof PackageCardOptions]?: PackageCardOptions[K] | undefined },
  hidden: { description: boolean; chart: boolean },
): string => {
  const {
    hide_border = false,
    hide_title = false,
    title,
    card_width,
    description_lines_count,
    show_icons = true,
    border_radius,
    disable_animations = false,
  } = options;

  const width = Math.max(MIN_CARD_WIDTH, card_width ?? CARD_STYLE.width.standard);
  const innerWidth = width - 2 * X_OFFSET;
  const formatCount = compactCountFormatter(options);

  const maxLines = clampValue(
    description_lines_count ?? DESCRIPTION_DEFAULT_LINES,
    1,
    DESCRIPTION_MAX_LINES,
  );
  const lines = hidden.description
    ? []
    : wrapTextMultiline(content.description, innerWidth, DESCRIPTION_FONT_SIZE, maxLines);
  const weeks = hidden.chart ? [] : content.weeks;

  let y = 0;
  const descriptionY = y;
  y += lines.length > 0 ? lines.length * DESCRIPTION_LINE_HEIGHT + SECTION_GAP : 0;
  const chartY = y;
  y += weeks.length > 0 ? CHART_HEIGHT + SECTION_GAP : 0;
  const rowsY = y;
  y += content.stats.length > 0 ? (content.stats.length - 1) * ROW_HEIGHT + ROW_INK : 0;

  // `Card` takes the title's room back off a hidden title's height itself
  const height = CARD_STYLE.padding.bodyOffsetY + Math.max(y, 0) + CARD_STYLE.padding.bottom;

  const rows = content.stats.map((stat, index) =>
    createTextNode({
      icon: stat.icon,
      label: stat.label,
      value: stat.value,
      id: stat.id,
      index,
      showIcons: show_icons,
      valueAnchorX: innerWidth,
      bold: true,
      labelBold: false,
      formatValue: formatCount,
    }),
  );

  const { lightColors, darkColors } = getLightDarkColors(options);
  const card = new Card({
    title: title ?? content.title,
    titlePrefixIcon: content.titleIcon,
    width,
    height,
    border_radius,
    colors: { light: lightColors, dark: darkColors },
    description: [
      `${content.title} v${content.version}.`,
      lines.length > 0 ? content.description : '',
      weeks.length > 0 ? content.chartLabel : '',
      ...content.stats.map(
        (stat) =>
          `${stat.label}: ${typeof stat.value === 'number' ? formatCount(stat.value) : stat.value}`,
      ),
    ]
      .filter(Boolean)
      .join(' '),
    hideBorder: hide_border,
    hideTitle: hide_title,
    animations: !disable_animations,
    css: ({ textColor, iconColor }): Array<CssChild> => [
      rule('.description', { font: font('regular', 'meta'), fill: textColor }),
      rule('.chart rect', {
        fill: HEAT_PAINT.line,
        animation: 'fadeInAnimation 0.6s ease-in-out backwards',
      }),
      rule('.stat', { font: font('regular', 'small'), fill: textColor }),
      rule('.stagger', { animation: 'fadeInAnimation 0.3s ease-in-out backwards' }),
      rule('.not_bold', { 'font-weight': CARD_STYLE.fontWeight.regular }),
      rule('.bold', { 'font-weight': CARD_STYLE.fontWeight.semibold }),
      rule('.icon', { fill: iconColor, display: 'block' }),
    ],
  });

  return card.render([
    lines.length > 0
      ? el(
          'text',
          { 'data-testid': 'description', class: 'description', x: X_OFFSET, y: descriptionY },
          lines.map((line) => el('tspan', { dy: '1.2em', x: X_OFFSET }, line)),
        )
      : undefined,
    weeks.length > 0
      ? el('g', { transform: `translate(${X_OFFSET}, ${chartY})` }, chart(weeks, innerWidth))
      : undefined,
    rows.length > 0
      ? el(
          'g',
          // each row pads itself
          { transform: `translate(0, ${rowsY})` },
          flexLayout({ items: rows, gap: ROW_HEIGHT, direction: 'column' }),
        )
      : undefined,
  ]);
};

export { renderPackageCard };
export type { PackageCardOptions, PackageStat };
