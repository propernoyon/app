export const storeConfig = {
  name:
    process.env.NEXT_PUBLIC_STORE_NAME || "Mini Mercado",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || "",
  contact: process.env.NEXT_PUBLIC_STORE_CONTACT || "",
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS || "",
  openingHours: process.env.NEXT_PUBLIC_STORE_OPENING_HOURS || "",
  currency:
    process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "EUR",
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en",
  social: {
    instagram: process.env.NEXT_PUBLIC_STORE_INSTAGRAM || "#",
    facebook: process.env.NEXT_PUBLIC_STORE_FACEBOOK || "#",
    twitter: process.env.NEXT_PUBLIC_STORE_TWITTER || "#",
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;