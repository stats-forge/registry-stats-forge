import { commonParams, enumListParam, statRowParams, titleParams } from '@stats-forge/card-kit';
import * as z from 'zod/mini';

import { renderNpmCard } from '../cards/npm/index.ts';
import { fetchNpmPackage } from '../fetchers/npm/index.ts';

import { cardHandler } from './handler.ts';
import { npmNameParam, packageCardParams } from './params.ts';

/** `/api/npm?package=…`: an npm package's latest version and downloads. */
export const npm = cardHandler(
  z.object({
    package: npmNameParam,
    hide: enumListParam(renderNpmCard.OPTIONS.hide),
    ...packageCardParams,
    ...commonParams,
    ...titleParams,
    ...statRowParams,
  }),
  { package: 'npm' },
  async (params, theme, config) =>
    renderNpmCard(await fetchNpmPackage({ package: params.package }, config), {
      ...params,
      ...theme,
    }),
);
