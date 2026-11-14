import { httpRequest } from '@stats-forge/card-kit';
import type { HttpResponse } from '@stats-forge/card-kit';

import type { CardConfig } from './config.ts';
import { CardError } from './error.ts';
import type { Registry } from './error.ts';

/** crates.io refuses a request without a User-Agent naming the client and where to reach it. */
const USER_AGENT = 'registry-stats-forge (https://github.com/stats-forge/registry-stats-forge)';

/**
 * A GET of a registry's JSON. A 404 comes back for the fetcher to word, being the one status that
 * means a name rather than the registry; every other failure is thrown here.
 *
 * @throws {CardError} When the registry cannot be reached, is rate limiting, or answers 5xx.
 *
 * @returns The response, a 2xx or a 404.
 */
const getJson = async <TData>(
  config: CardConfig,
  registry: Registry,
  url: string,
): Promise<HttpResponse<TData>> => {
  let response: HttpResponse<TData>;
  try {
    response = await httpRequest<TData>(config.fetch, url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
  } catch (error) {
    throw CardError.because('registry_unreachable', { registry, cause: error });
  }
  if (response.status === 429) {
    throw CardError.because('registry_rate_limited', { registry });
  }
  if (response.status !== 404 && (response.status < 200 || response.status >= 300)) {
    config.logger.error(`${registry} answered ${String(response.status)} for ${url}`);
    throw CardError.because('registry_unavailable', { registry, status: response.status });
  }
  return response;
};

export { getJson, USER_AGENT };
