import { publicEnv } from "./env";

/** Storefront identity and contact details, used by the header, footer and SEO. */
export const storeConfig = {
  name: publicEnv.storeName,
  email: publicEnv.storeEmail,
  phone: publicEnv.storePhone,
  address: publicEnv.storeAddress,
  openingHours: publicEnv.openingHours,
  currencyCode: publicEnv.defaultCurrency,
  appUrl: publicEnv.siteUrl,
} as const;
