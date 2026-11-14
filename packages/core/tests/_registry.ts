/**
 * @file A registry that answers by URL, and the config the specs read its requests through.
 */

import type { FetchLike, Logger } from '@stats-forge/card-kit';
import { vi } from 'vitest';

import { CardConfig } from '../src/common/config.ts';
import type { DailyDownloads } from '../src/common/downloads.ts';

/** One answer, for a request to exactly `url`. */
interface Reply {
  url: string;
  status: number;
  body: unknown;
}

/** @returns An answer of `body` to `url`. */
const reply = (url: string, body: unknown, status = 200): Reply => ({ url, status, body });

/**
 * A transport answering each request from `replies`; a URL none names fails as the network would.
 *
 * @returns The transport, its calls recorded.
 */
const registry = (...replies: Array<Reply>): ReturnType<typeof vi.fn<FetchLike>> =>
  vi.fn<FetchLike>(async (input) => {
    const answer = replies.find(({ url }) => url === input);
    if (!answer) {
      return Promise.reject(new TypeError(`fetch failed: nothing answers ${input}`));
    }
    return Promise.resolve(Response.json(answer.body, { status: answer.status }));
  });

/** A logger the specs assert on, so nothing a test provokes reaches the console. */
const testLogger = (): Logger => ({ log: vi.fn<Logger['log']>(), error: vi.fn<Logger['error']>() });

/** @returns Config sending through `fetch`, logging to `testLogger`. */
const testConfig = (fetch: FetchLike, logger: Logger = testLogger()): CardConfig =>
  new CardConfig({ fetch, logger });

/**
 * `count` days ending on `lastDay`, each `perDay(index)` downloads, oldest first.
 *
 * @returns The days, as both registries report them.
 */
const days = (
  lastDay: string,
  count: number,
  perDay: (index: number) => number = () => 1,
): Array<DailyDownloads> => {
  const last = Date.parse(`${lastDay}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) => ({
    day: new Date(last - (count - 1 - index) * 86_400_000).toISOString().slice(0, 10),
    downloads: perDay(index),
  }));
};

/** The clock every dated spec runs at: 08:00 UTC, part way through 2026-11-14. */
const NOW = new Date('2026-11-14T08:00:00Z');

export { days, NOW, registry, reply, testConfig, testLogger };
export type { Reply };
