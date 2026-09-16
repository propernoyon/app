/**
 * Public surface of the API layer.
 *
 * Import from here rather than reaching into individual modules, so the
 * real/mock switch and the caching policy stay behind one boundary.
 *
 * Everything exported is server-only (the modules import `server-only`).
 */
export { apiConfig } from "./client";
export { PosApiError, isPosApiError, toPosApiError, POS_ERROR_MESSAGE_KEYS } from "./errors";
export type { PosErrorKind } from "./errors";

export {
  listProducts,
  getProduct,
  listFeaturedProducts,
  listRelatedProducts,
  clampPerPage,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  PRODUCTS_CACHE_TAG,
} from "./products";
export type { ProductQuery } from "./products";

export { listCategories, getCategoryBySlug, CATEGORIES_CACHE_TAG } from "./categories";
export { getStoreSettings, SETTINGS_CACHE_TAG } from "./settings";
export { getLiveStock, checkStock } from "./stock";
export type { StockCheck } from "./stock";

export { createOrder, getOrderByReference, toOrderPayload, isValidOrderReference } from "./orders";

export type { StoreSettings } from "./normalize";
export type { ProductListResult, LiveStock, Pagination } from "./normalize";
