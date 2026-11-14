# AGENTS.md

Guidance for Claude Code in this repository. It follows
[github-stats-forge](https://github.com/stats-forge/github-stats-forge)'s rules on TypeScript, tests,
comments, linting and changesets; this file holds what differs, and each `AGENTS.md` below it what
is true of its directory.

## Before you change anything

- **Don't commit, push, open a PR or comment on one unless asked.**
- **A change to `packages/*` carries a changeset, unasked**: a conventional-commit first line with no
  scope, and pre-1.0 a breaking change is `minor`.
- **Run `pnpm check-all` before handing work over**: format, lint, typecheck, knip, coverage and
  `lint:publish`, in that order.

## What this is

Package registry stats drawn as SVG cards, one card per registry, with what every stats-forge card
shares (frame, themes, locales, errors, the query-string boundary) coming from
[`@stats-forge/card-kit`](https://github.com/stats-forge/card-kit).

| Path            | What it is                                                 |
| --------------- | ---------------------------------------------------------- |
| `packages/core` | Fetchers, cards and api handlers: `/api/npm`, `/api/crate` |
| `packages/cli`  | `registry-stats-forge`: flags in, an SVG written out       |

- **A change to how every card looks is made in the kit**, then checked here by linking the checkout
  (`'@stats-forge/card-kit': link:../card-kit` under `overrides` in `pnpm-workspace.yaml`, never
  committed) and running `pnpm check-all`.
- **No registry needs a token.** crates.io refuses a request without a `User-Agent` naming the
  client, which `common/http.ts` sends on every request.

## Commands

```sh
pnpm test                 # vitest, both packages, one run
pnpm test:coverage        # the same, failing under a floor in vitest.config.coverage.ts
pnpm typecheck            # build, then tsc against the built .d.ts
pnpm lint                 # oxlint
pnpm lint:knip            # unused files, exports and dependencies
pnpm lint:publish         # attw + publint in each package
pnpm format               # oxfmt --write .
pnpm cli --help           # build, then run the CLI
pnpm check-all            # every check, cheapest first
```

## TypeScript

- **An exported zod param is annotated with a named type** (`TextParam`, `IntegerParam` in
  `api/params.ts`). Inferred, its emitted `.d.ts` names the kit's own copy of zod, which fails the
  build with TS2883 whenever the kit is linked.
