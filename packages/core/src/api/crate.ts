import { commonParams, enumListParam, statRowParams, titleParams } from '@stats-forge/card-kit';
import * as z from 'zod/mini';

import { renderCrateCard } from '../cards/crate/index.ts';
import { fetchCrate } from '../fetchers/crate/index.ts';

import { cardHandler } from './handler.ts';
import { crateNameParam, packageCardParams } from './params.ts';

/** `/api/crate?crate=…`: a crate's default version and downloads. */
export const crate = cardHandler(
  z.object({
    crate: crateNameParam,
    hide: enumListParam(renderCrateCard.OPTIONS.hide),
    ...packageCardParams,
    ...commonParams,
    ...titleParams,
    ...statRowParams,
  }),
  { crate: 'crate' },
  async (params, theme, config) =>
    renderCrateCard(await fetchCrate({ crate: params.crate }, config), { ...params, ...theme }),
);
