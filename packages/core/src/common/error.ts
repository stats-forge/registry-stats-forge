/**
 * @file The failures the registry cards are thrown for, worded once and registered with the kit's
 * `CardError` on import: a module that throws one imports `CardError` from here.
 */

import { registerFailures, TRY_AGAIN_LATER } from '@stats-forge/card-kit';
import type { Failure } from '@stats-forge/card-kit';

/** A registry, as a failure names it. */
type Registry = 'npm' | 'crates.io';

/** Every failure of this package, by reason, worded from the data its throw site gives. */
const FAILURES = {
  crate_not_found: (): Failure => ({
    code: 'not_found',
    message: 'Crate not found',
    secondaryMessage: 'Make sure the crate is published on crates.io',
  }),
  npm_package_not_found: (): Failure => ({
    code: 'not_found',
    message: 'Package not found',
    secondaryMessage: 'Make sure the package is published on npm',
  }),
  /** The registry answered, but not with anything a card can draw. */
  registry_unavailable: ({
    registry,
    status,
  }: {
    registry: Registry;
    status: number;
  }): Failure => ({
    code: 'upstream',
    retryable: true,
    message: `${registry} answered with HTTP ${String(status)}`,
    secondaryMessage: TRY_AGAIN_LATER,
    reportable: false,
  }),
  registry_rate_limited: ({ registry }: { registry: Registry }): Failure => ({
    code: 'rate_limited',
    retryable: true,
    message: `Downtime due to ${registry} rate limiting`,
    secondaryMessage: TRY_AGAIN_LATER,
    reportable: false,
  }),
  /** The transport failure the request ended on. */
  registry_unreachable: ({ registry, cause }: { registry: Registry; cause: unknown }): Failure => ({
    code: 'upstream',
    retryable: true,
    message: `Could not reach ${registry}`,
    secondaryMessage: TRY_AGAIN_LATER,
    cause,
    reportable: false,
  }),
};

type RegistryFailures = typeof FAILURES;

declare module '@stats-forge/card-kit' {
  // oxlint-disable-next-line typescript/no-empty-object-type -- adds this package's reasons
  interface Failures extends RegistryFailures {}
}

registerFailures(FAILURES);

export { CardError } from '@stats-forge/card-kit';
export type { Registry };
