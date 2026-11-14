# registry-stats-forge

Package registry stats as SVG cards: an npm package or a crate, its latest version, twelve weeks of
downloads and what it declares.

| Card   | Endpoint                 | Required  |
| ------ | ------------------------ | --------- |
| npm    | `/api/npm?package=zod`   | `package` |
| crates | `/api/crate?crate=serde` | `crate`   |

- [`@stats-forge/registry-stats-forge-core`](packages/core): the fetchers, cards and api handlers
- [`@stats-forge/registry-stats-forge-cli`](packages/cli): draws a card into a local SVG

Both registries answer without a token. The cards share their frame, themes and locales with
[github-stats-forge](https://github.com/stats-forge/github-stats-forge) through
[`@stats-forge/card-kit`](https://github.com/stats-forge/card-kit).

## Development

```sh
pnpm install
pnpm check-all
```
