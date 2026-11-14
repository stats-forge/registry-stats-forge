# packages/cli

> Scoped to this tree; the repo-wide rules are in the root `AGENTS.md`.

- **Flags only, no prompts**: `--card`, `--options` (a query string or a card URL), `--out`,
  `--check`. A card that could not be drawn exits `1`, or `75` (`EX_TEMPFAIL`) when a retry may work.
- **`src/run.ts` takes everything it touches as `Io`**: config, working directory, both streams and
  the version, so its spec runs it in a `mkdtemp` dir against a fake registry. `src/index.ts` only
  binds it to the process, and `tests/index.spec.ts` imports it once per case.
- **`bin.js` stays JavaScript**: pnpm links the bin before anything is built.
