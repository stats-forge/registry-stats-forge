# packages/core

> Scoped to this tree; the repo-wide rules are in the root `AGENTS.md`.

`src` is `fetchers/` (network) → `cards/` (render) → `api/` (query-string handlers), plus `common/`.

## A registry

- **A card per registry**, each a folder under `cards/` and `fetchers/`, as in github-stats-forge.
  The layout both draw is `common/package-card.ts`: a description, a chart of weekly downloads,
  then a row per stat. A card decides only its rows and their labels.
- **A fetcher requests through `getJson`**, which throws every failing status but a 404, handed
  back for the fetcher to word as its own `*_not_found`. It also validates the name it puts in a
  URL, since `./fetchers` is public.
- **The chart ends on the last day the registry has finished counting.** npm reports yesterday as
  `0` until it has, and crates.io reports today so far; each fetcher passes `weeklyTotals` its last
  whole day, and a later one is dropped rather than drawn as a dip.
- **Counts are written by `common/count.ts`**, compact through `Intl` (`453.4M`, `1.7B`): the kit's
  `countFormatter` stops at thousands.

## The api layer

- **Each handler names its identity param for the allowlist**: `{ package: 'npm' }` and
  `{ crate: 'crate' }`, guarded by `NPM_ALLOWLIST` and `CRATE_ALLOWLIST`, each case-insensitive.
- **Every failure of this package lives in `common/error.ts`**, registered with the kit's `CardError`
  on import; a registry's outage, rate limit and transport failure are retryable.

## Tests

- **Specs answer requests through `tests/_registry.ts`**, by exact URL, and run dated ones at its
  `NOW`; a URL nothing answers fails as the network would.
- **A reply body is typed by the fetcher's wire type** (`LatestManifest`, `CrateResponse`, …), each
  exported from its `types.ts` for that reason.
