# @stats-forge/registry-stats-forge-cli

Draws an npm package's or a crate's stats card into a local SVG.

```sh
npx @stats-forge/registry-stats-forge-cli --card npm --options "package=zod&theme=ember_dark"
npx @stats-forge/registry-stats-forge-cli --card crate --options "crate=serde" --out cards/serde.svg
```

| Flag                | What it does                                                |
| ------------------- | ----------------------------------------------------------- |
| `-c, --card <id>`   | `npm` or `crate`                                            |
| `--options <query>` | The card's options as a query string, or a card URL         |
| `-o, --out <file>`  | Where to write it; defaults to `<card>-<name>.svg`          |
| `--check`           | Fail when `--out` differs from the card, instead of writing |

A card that could not be drawn exits `1`, or `75` when a later run may draw it, such as after a
rate limit. The options are those of
[`@stats-forge/registry-stats-forge-core`](https://github.com/stats-forge/registry-stats-forge/tree/main/packages/core#options).
