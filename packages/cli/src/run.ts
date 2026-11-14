/**
 * @file The command: flags in, a card written out. Everything it touches arrives through
 * {@link Io}, so a spec drives it without a terminal or the network.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { crate, npm, queryOf } from '@stats-forge/registry-stats-forge-core/api';
import type { ApiResult, CardConfig } from '@stats-forge/registry-stats-forge-core/api';

/** `EX_TEMPFAIL` from `sysexits.h`: a failure a later run may not repeat, such as a rate limit. */
const EXIT_RETRYABLE = 75;

/** Each card, and the param naming what it draws. */
const CARDS = {
  npm: { render: npm, identity: 'package' },
  crate: { render: crate, identity: 'crate' },
} as const;

type CardId = keyof typeof CARDS;

/** What the command reads and writes besides the files. */
interface Io {
  config: CardConfig;
  /** Where a relative `--out` and the default file name resolve from. */
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  version: string;
}

const HELP = `registry-stats-forge — render a package registry's stats card to a local SVG

Usage
  registry-stats-forge --card <id> --options <query> [--out <file>] [--check]

Options
  -c, --card <id>        The card: ${Object.keys(CARDS).join(', ')}
      --options <query>  Its options as a query string, or a card URL to take them from;
                         npm needs package=<name>, crate needs crate=<name>
  -o, --out <file>       Where to write it (default: <card>-<name>.svg)
      --check            Fail when --out differs from the card instead of writing it
  -h, --help             Show this
  -v, --version          Show the version

A card that could not be drawn exits 1, or 75 when a later run may draw it.
`;

/** @returns Whether `value` names a card. */
const isCardId = (value: string): value is CardId => Object.hasOwn(CARDS, value);

/**
 * Reads a bare query string, one with its `?`, or a whole card URL.
 *
 * @returns The params it carries.
 */
const fromQueryString = (value: string): Record<string, string> => {
  const trimmed = value.trim();
  // a pasted card URL is a query string with an address in front of it
  const start = /^https?:\/\//iu.test(trimmed) ? trimmed.indexOf('?') + 1 : 0;
  return queryOf(new URLSearchParams(trimmed.slice(start)));
};

/** @returns The default file for a card: `npm-types-node.svg` for `@types/node`. */
const defaultFile = (card: CardId, name: string): string =>
  `${card}-${name.replace(/^@/u, '').replaceAll('/', '-')}.svg`;

/** @returns The failure as stderr shows it. */
const describeFailure = (card: CardId, result: Extract<ApiResult, { status: 'error' }>): string => {
  const { code, text, param } = result.error;
  return [
    `Could not render the ${card} card.`,
    `  ${text}`,
    `  code: ${code}${param ? `, param: ${param}` : ''}`,
    result.retryable ? '  This one may work on a retry.' : '',
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * Runs the command.
 *
 * @returns The exit code.
 */
const run = async (argv: Array<string>, io: Io): Promise<number> => {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        card: { type: 'string', short: 'c' },
        options: { type: 'string' },
        out: { type: 'string', short: 'o' },
        check: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    }));
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n\n${HELP}`);
    return 1;
  }

  if (values.help) {
    io.stdout(HELP);
    return 0;
  }
  if (values.version) {
    io.stdout(`${io.version}\n`);
    return 0;
  }
  const { card, options = '', out, check } = values;
  if (card === undefined || !isCardId(card)) {
    io.stderr(`--card must be one of: ${Object.keys(CARDS).join(', ')}\n\n${HELP}`);
    return 1;
  }

  const query = fromQueryString(options);
  const result = await CARDS[card].render(query, io.config);
  if (result.status === 'error') {
    io.stderr(`${describeFailure(card, result)}\n`);
    return result.retryable ? EXIT_RETRYABLE : 1;
  }

  const file = resolve(io.cwd, out ?? defaultFile(card, query[CARDS[card].identity] ?? ''));
  const shown = relative(io.cwd, file);
  if (check) {
    const committed = await readFile(file, 'utf8').catch(() => null);
    if (committed === result.content) {
      io.stdout(`${shown} is up to date\n`);
      return 0;
    }
    io.stderr(`${shown} is out of date; run again without --check to redraw it\n`);
    return 1;
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, result.content);
  io.stdout(`Wrote ${shown}\n`);
  return 0;
};

export { EXIT_RETRYABLE, run };
export type { Io };
