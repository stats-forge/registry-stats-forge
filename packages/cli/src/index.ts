#!/usr/bin/env node
/**
 * @file The bin's entry: the command, run against this process.
 */

import { readFile } from 'node:fs/promises';
import { formatWithOptions } from 'node:util';

import { CardConfig } from '@stats-forge/registry-stats-forge-core/api';

import { run } from './run.ts';

/** Room for a slow connection, well short of undici's five minutes on a stalled one. */
const REQUEST_TIMEOUT_MS = 30_000;

const toStderr = (...args: Array<unknown>): void => {
  process.stderr.write(`${formatWithOptions({}, ...args)}\n`);
};

// the same path from `src/` and `build/`
const { version } = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

process.exitCode = await run(process.argv.slice(2), {
  config: CardConfig.fromEnv(process.env).with({
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    logger: { log: toStderr, error: toStderr },
  }),
  cwd: process.cwd(),
  stdout: (text) => {
    process.stdout.write(text);
  },
  stderr: (text) => {
    process.stderr.write(text);
  },
  version,
});
