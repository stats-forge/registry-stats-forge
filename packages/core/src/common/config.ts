import { consoleLogger, defaultFetch, withTimeout } from '@stats-forge/card-kit';
import type { FailureReason, FetchLike, Logger } from '@stats-forge/card-kit';

type Env = Record<string, string | undefined>;

/** Which list guards an identity: a package's name on its own registry. */
type AllowlistKind = 'npm' | 'crate';

/** Overrides for a {@link CardConfig}; the constructor defaults anything omitted. */
interface CardConfigInit {
  npmAllowlist?: ReadonlyArray<string> | undefined;
  crateAllowlist?: ReadonlyArray<string> | undefined;
  fetch?: FetchLike;
  requestTimeoutMs?: number | undefined;
  hints?: Partial<Record<FailureReason, string>>;
  logger?: Logger;
}

/** @returns The comma-separated values, trimmed, or `undefined` when the variable is unset or empty. */
const parseCsv = (value: string | undefined): Array<string> | undefined => {
  const values = (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  return values.length > 0 ? values : undefined;
};

/**
 * Deployment-wide configuration for the card renderers.
 *
 * Immutable, and built by the host rather than read from the environment, so the
 * library behaves identically under Node, in the browser and under vitest.
 */
export class CardConfig {
  /** Allowed npm packages; `undefined` means no allowlist configured. */
  readonly npmAllowlist: ReadonlyArray<string> | undefined;
  /** Allowed crates; `undefined` means no allowlist configured. */
  readonly crateAllowlist: ReadonlyArray<string> | undefined;
  /** Milliseconds each request may take before it fails as a `TimeoutError`; `undefined` waits. */
  readonly requestTimeoutMs: number | undefined;
  /** Transport every fetcher sends through, bounded by `requestTimeoutMs`; defaults to `globalThis.fetch`. */
  readonly fetch: FetchLike;
  /** A host's own second line for a failure, by reason: its advice in place of the card's. */
  readonly hints: Partial<Record<FailureReason, string>>;
  /** Where the diagnostics go; defaults to `console`. */
  readonly logger: Logger;
  /** The transport as given, so `with` never wraps it twice. */
  private readonly transport: FetchLike;

  constructor(init: CardConfigInit = {}) {
    this.npmAllowlist = init.npmAllowlist;
    this.crateAllowlist = init.crateAllowlist;
    this.transport = init.fetch ?? defaultFetch;
    this.requestTimeoutMs = init.requestTimeoutMs;
    this.fetch = withTimeout(this.transport, this.requestTimeoutMs);
    this.hints = init.hints ?? {};
    this.logger = init.logger ?? consoleLogger;
  }

  /** @returns Config for this deployment. */
  static fromEnv(env: Env): CardConfig {
    return new CardConfig({
      npmAllowlist: parseCsv(env['NPM_ALLOWLIST']),
      crateAllowlist: parseCsv(env['CRATE_ALLOWLIST']),
    });
  }

  /**
   * npm names are lowercase and crate names match case-insensitively, so both lists do; an absent
   * list serves anyone.
   *
   * @returns Whether this deployment serves the package.
   */
  isAllowed(id: string, kind: AllowlistKind): boolean {
    const list = kind === 'npm' ? this.npmAllowlist : this.crateAllowlist;
    const wanted = id.toLowerCase();
    return list === undefined || list.some((allowed) => allowed.toLowerCase() === wanted);
  }

  /** @returns A copy with `overrides` applied. */
  with(overrides: CardConfigInit): CardConfig {
    return new CardConfig({
      npmAllowlist: this.npmAllowlist,
      crateAllowlist: this.crateAllowlist,
      fetch: this.transport,
      requestTimeoutMs: this.requestTimeoutMs,
      hints: this.hints,
      logger: this.logger,
      ...overrides,
    });
  }
}

export type { AllowlistKind, CardConfigInit };
