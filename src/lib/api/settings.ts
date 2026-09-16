import "server-only";

import { apiConfig, posRequest } from "./client";
import { mockSettings } from "./mock";
import { toSettings, type StoreSettings } from "./normalize";

/** Settings change rarely — cache for an hour and tag for on-demand revalidation. */
export const SETTINGS_CACHE_TAG = "store-settings";
const SETTINGS_REVALIDATE_SECONDS = 3600;

/**
 * Store settings (app name + currency symbol). The symbol is mapped to an ISO
 * code so `Intl` can format prices correctly for each locale.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  const payload = apiConfig.useMock
    ? await mockSettings()
    : await posRequest<unknown>("/settings", {
        revalidate: SETTINGS_REVALIDATE_SECONDS,
        tags: [SETTINGS_CACHE_TAG],
      });

  return toSettings(payload);
}
