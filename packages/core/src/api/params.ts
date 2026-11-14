/**
 * @file The params only the registry cards take: a package's name on each registry, checked
 * before any request since it lands in a URL.
 */

import { intParam, patternParam } from '@stats-forge/card-kit';
import type { RejectionWording } from '@stats-forge/card-kit';
import type * as z from 'zod/mini';

import { CRATE_NAME_PATTERN, NPM_NAME_PATTERN } from '../common/names.ts';

/** Every rejection these params can put on an error card; the kit words its own. */
const REJECTION_MESSAGES: Record<'npm_name' | 'crate_name', RejectionWording> = {
  npm_name: (param) => `Invalid npm package name for parameter "${param}"`,
  crate_name: (param) => `Invalid crate name for parameter "${param}"`,
};

// named types, so the emitted `.d.ts` reads zod through this package rather than the kit's copy
type TextParam = z.ZodMiniType<string | undefined, string | undefined>;
type IntegerParam = z.ZodMiniType<number | undefined, string | undefined>;

/** An npm package, scoped or not, as the registry spells it. */
const npmNameParam: TextParam = patternParam(REJECTION_MESSAGES.npm_name, NPM_NAME_PATTERN);

/** A crate, as crates.io spells it. */
const crateNameParam: TextParam = patternParam(REJECTION_MESSAGES.crate_name, CRATE_NAME_PATTERN);

/** What both cards accept beside the kit's shared fragments. */
const packageCardParams: { card_width: IntegerParam; description_lines_count: IntegerParam } = {
  card_width: intParam({ min: 300, max: 1000, px: true }),
  description_lines_count: intParam({ max: 3 }),
};

export { crateNameParam, npmNameParam, packageCardParams };
