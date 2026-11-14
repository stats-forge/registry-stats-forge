# @stats-forge/registry-stats-forge-core

Draws an npm package's or a crate's stats as an SVG card.

```sh
npm install @stats-forge/registry-stats-forge-core
```

```ts
import { CardConfig, crate, npm } from '@stats-forge/registry-stats-forge-core/api';

const config = CardConfig.fromEnv(process.env);
const result = await npm({ package: 'zod', theme: 'ember_dark' }, config);
if (result.status === 'success') {
  // result.content is the SVG
}
```

Each handler takes the query string's params and answers with the SVG, or an error card plus a
`code` and whether a retry may help. `./fetchers` exports `fetchNpmPackage` and `fetchCrate` alone.

## Options

Both cards take `theme`, `title`, `hide_title`, `hide_border`, `border_radius`, `locale`,
`disable_animations`, `show_icons`, `number_format`, `number_precision`, `card_width` (300–1000) and
`description_lines_count` (1–3), plus `hide`, a comma-separated list of:

- **npm**: `description`, `chart`, `version`, `weekly_downloads`, `dependencies`, `size`, `license`
- **crate**: `description`, `chart`, `version`, `recent_downloads`, `downloads`, `versions`,
  `license`, `msrv`

## Deployment

`NPM_ALLOWLIST` and `CRATE_ALLOWLIST`, comma-separated, pin a deployment to the packages they name;
either unset serves anything.

It is 0.x: a minor release may break the API.
