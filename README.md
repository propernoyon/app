# Mini Mercado — online storefront

A production-ready, API-driven e-commerce storefront for a mini mercado / convenience
grocery store. It is a **Next.js 16** (App Router, React 19, TypeScript, Tailwind v4)
application that talks to the **MATC POS REST API** entirely server-side, so the POS API
key never reaches the browser.

- Two languages out of the box (English, European Portuguese) with locale-prefixed, SEO-friendly URLs
- Server Components by default; client JavaScript only where interaction requires it
- Products, categories, stock and orders all come from the POS — nothing is hard-coded
- Product images can be overridden from a built-in admin area without touching the POS
- Anonymous cart persisted in `localStorage`, re-validated against live stock at checkout

---

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Connecting the real POS API](#connecting-the-real-pos-api)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Product images](#product-images)
- [Admin area](#admin-area)
- [Translations](#translations)
- [Adding a language](#adding-a-language)
- [Age-restricted products](#age-restricted-products)
- [Caching](#caching)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Known limitations & deliberate decisions](#known-limitations--deliberate-decisions)

---

## Requirements

| Requirement | Version                                       |
| ----------- | --------------------------------------------- |
| Node.js     | **20.9+** (24 LTS recommended)                |
| npm         | 10+                                           |
| POS API     | Reachable over HTTPS with a valid `X-API-Key` |

## Quick start

```bash
npm install
cp .env.example .env.local     # then edit it (see below)
npm run dev                    # http://localhost:3000
```

The storefront ships with a **mock mode** so you can work on the UI before the POS is
reachable. It is enabled in the default `.env.local`:

```env
USE_MOCK_API=true
```

Mock mode returns fixture payloads **in the exact wire format of the POS API**, so the real
validators and normalizers still run — switching to the live API does not change any
rendering code.

Set `USE_MOCK_API=false` once you have filled in `API_KEY`.

## Connecting the real POS API

1. In the POS, go to **Admin → API Keys** and create a key with these permissions:
   `products.read`, `orders.read`, `orders.write` (or `*`).
2. Put the base URL and key in `.env.local`:

   ```env
   API_BASE_URL=https://your-pos-host/pos/api
   API_KEY=the-key-you-just-created
   USE_MOCK_API=false
   ```

3. If your host uses a self-signed certificate (typical for local XAMPP), set
   `ALLOW_INSECURE_TLS=true` **for development only**. It is ignored when
   `NODE_ENV=production`.

`API_KEY` must never be prefixed with `NEXT_PUBLIC_`. Only server modules read it
(`src/lib/api/client.ts`, which is marked `server-only` — importing it from a Client
Component fails the build).

## Environment variables

Everything is documented in [`.env.example`](./.env.example). Summary:

| Variable                                                             | Required  | Purpose                                                                 |
| -------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `API_BASE_URL`                                                       | yes       | Base URL of the POS API, without a trailing slash                       |
| `API_KEY`                                                            | yes       | POS API key. **Server-side only**                                       |
| `USE_MOCK_API`                                                       | no        | `true` serves fixtures instead of calling the POS                       |
| `ALLOW_INSECURE_TLS`                                                 | no        | Dev-only: accept a self-signed certificate                              |
| `NEXT_PUBLIC_SITE_URL`                                               | yes       | Canonical origin, used for SEO and JSON-LD                              |
| `NEXT_PUBLIC_STORE_NAME`                                             | no        | Store name shown in the header, footer and manifest                     |
| `NEXT_PUBLIC_STORE_EMAIL` / `_PHONE` / `_ADDRESS` / `_OPENING_HOURS` | no        | Shown in the footer and used in structured data                         |
| `NEXT_PUBLIC_DEFAULT_CURRENCY`                                       | no        | ISO 4217 fallback; the live symbol comes from `GET /settings`           |
| `NEXT_PUBLIC_IMAGE_HOSTS`                                            | no        | Extra hostnames allowed for `next/image` (Cloudinary is always allowed) |
| `NEXT_PUBLIC_IMAGE_BASE_URL`                                         | no        | Base URL for legacy _relative_ image paths stored in the POS            |
| `ADMIN_EMAIL`                                                        | for admin | Sign-in address for the image admin                                     |
| `ADMIN_PASSWORD_HASH`                                                | for admin | scrypt hash — generate with `npm run admin:hash -- "your-password"`     |
| `ADMIN_PASSWORD`                                                     | dev only  | Plaintext fallback, **refused in production**                           |
| `ADMIN_SESSION_SECRET`                                               | for admin | 32+ char random string that signs the session cookie                    |
| `AGE_RESTRICTION_ENABLED`                                            | no        | Turn the age gate on (see below)                                        |
| `IMAGE_UPLOAD_MAX_BYTES`                                             | no        | Upload size cap in bytes (default 5 MB)                                 |

## Scripts

| Command                            | What it does                                            |
| ---------------------------------- | ------------------------------------------------------- |
| `npm run dev`                      | Development server (Turbopack)                          |
| `npm run build`                    | Production build                                        |
| `npm start`                        | Serve the production build                              |
| `npm run lint`                     | ESLint (`next lint` no longer exists in Next 16)        |
| `npm run typecheck`                | `next typegen` + `tsc --noEmit`                         |
| `npm test`                         | Vitest, single run                                      |
| `npm run test:watch`               | Vitest in watch mode                                    |
| `npm run format` / `format:check`  | Prettier                                                |
| `npm run admin:hash -- "password"` | Generate `ADMIN_PASSWORD_HASH` + `ADMIN_SESSION_SECRET` |

## Project structure

```text
src/
  app/
    [locale]/                 # root layout lives here → <html lang> per locale
      page.tsx                # home
      shop/                   # filters, sorting, pagination
      category/[slug]/        # dynamic, driven by the API's category list
      product/[id]/           # detail, specs, related products, structured data
      cart/  checkout/  order-success/[reference]/  track-order/
      loading.tsx  error.tsx  not-found.tsx
    admin/                    # own root layout, outside [locale], own auth
    dev/ui/                   # dev-only styleguide (404 in production)
    api/                      # route handlers (image serving, admin upload)
    actions/                  # Server Actions (checkout, admin sign-in)
    sitemap.ts  robots.ts  manifest.ts  global-error.tsx  icon.svg
  components/{ui,layout,product,cart,checkout,category,home,order,admin,seo,pwa}/
  lib/
    api/                      # client, schemas, normalize, services, mock
    domain/                   # pure models + helpers (money, status, product, cart…)
    cart/                     # external store, reducer, storage, history
    images/                   # upload processing, mapping store, resolution
    i18n/                     # config, dictionaries, formatters, routing
    validation/               # zod schemas for checkout
    admin/                    # session, guard, locale, constants
    seo/                      # canonical + hreflang helpers
  messages/{en,pt}.json
  messages/boundary/{en,pt}.json   # tiny catalogues for error boundaries
  styles/tokens.css                # the design system's single source of truth
docs/
data/                        # runtime: uploaded images + mapping (gitignored)
```

## How it works

### One server-side API layer

```text
Browser → Next.js server (Server Component | Server Action | Route Handler)
        → POS API (X-API-Key)
```

- `src/lib/api/client.ts` — the only module holding the key. Adds the header, applies a
  timeout, retries idempotent GETs once, unwraps the API envelope, and maps every failure
  to a typed `PosApiError`.
- `src/lib/api/schemas.ts` — zod schemas describing the **actual** wire format, taken from
  the POS source (`api/v1/*.php`).
- `src/lib/api/normalize.ts` — the adapter. Envelopes are accepted in several shapes
  (`{products}`, `{data}`, bare array), numbers are coerced, and each list item is parsed
  individually so one malformed product cannot blank a page. **A change in the POS response
  is absorbed here and nowhere else.**
- `src/lib/api/{products,categories,stock,orders,settings}.ts` — the services the pages call.

Pages read data directly from these services (no HTTP hop). Route Handlers and Server
Actions exist only for browser-initiated work: live stock checks, image uploads, order
submission.

### Failures are data, not crashes

`tryLoad()` turns an expected API failure into a result the page can render, so a POS
outage shows a friendly, localized message with a retry — and a build never fails because
the store happened to be down mid-prerender. Genuinely unexpected errors still bubble to
`error.tsx`.

### Cart

The cart is an **external store** consumed through `useSyncExternalStore`. That is what
makes it correct across the server/client boundary: the server always renders an empty
cart, `localStorage` is read in a subscription effect (never during render), and a
`storage` listener keeps multiple tabs in sync. Only basket data is stored — never
anything secret, and never a price the server would trust.

Quantities are capped by observed stock, and re-validated twice: on demand from the cart,
and again inside the checkout Server Action before the order is submitted.

### Checkout

A three-step form (details → delivery/pickup → review) in one real `<form>`, so it still
submits without JavaScript. Client-side checks only decide whether you may advance; the
Server Action re-validates everything, re-checks stock, enforces the age gate, POSTs to the
POS, and redirects to the confirmation page. Failures come back as state, so nothing the
customer typed is lost.

## Product images

The POS stores a Cloudinary URL (or nothing) in `products.image`. This storefront layers an
optional **local override** on top, resolved in this order:

1. an image uploaded through `/admin` → `data/product-images.json` + `data/product-images/*.webp`
2. the `image_url` from the POS (Cloudinary)
3. a branded SVG placeholder — never a broken image icon

Uploads are associated with a product **by product id**, and the mapping is a plain JSON
file, so adding an image never requires a code change:

```json
{
  "7": {
    "productId": 7,
    "file": "p7-9f2c1ab34de5f607.webp",
    "mime": "image/webp",
    "width": 1200,
    "height": 1200,
    "bytes": 84213,
    "hash": "9f2c1ab34de5f607",
    "blurDataURL": "data:image/webp;base64,…",
    "updatedAt": "2026-02-03T14:40:00.000Z"
  }
}
```

Uploads are validated in five layers: size cap → magic-byte sniff → real decode by `sharp`
→ re-encode to WebP (which strips EXIF and any embedded payload) → a **generated** file
name. Client-supplied file names and content types are never trusted, and the public URL
is `/api/images/{id}/{hash}` — the hash makes it immutable and cache-busting.

`data/` is gitignored; **back it up** with your database.

## Admin area

`/admin` (sign-in at `/admin/login`) is a small, separate, unindexed area whose only job is
image management: search the catalogue, see each product's current image and where it comes
from, then upload, replace or remove it.

Set it up with:

```bash
npm run admin:hash -- "a-strong-password"
# paste ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET into .env.local
# set ADMIN_EMAIL to the address you want to sign in with
```

Authentication is a single operator account from the environment. Sessions are a stateless
HMAC-signed token in an `httpOnly` cookie; the password is verified with scrypt and a
constant-time comparison; sign-in attempts are rate limited. `proxy.ts` performs a cheap
cookie presence check for redirects, but **every admin page, Server Action and Route
Handler re-verifies the session** — a redirect is never the access control.

## Translations

All UI text lives in `src/messages/en.json` and `src/messages/pt.json`. `en.json` is the
type source of truth: the `Dictionary` type is derived from it, so a missing or misspelled
key is a compile error rather than a blank label.

Components read messages as typed objects — `dict.common.addToCart` — instead of string
lookups. A typo cannot silently fall back to a key name at runtime. A test additionally
asserts that `pt.json` has exactly the same keys, no empty strings, and identical
`{placeholders}`.

Formatting (currency, dates, numbers, plurals) goes through `src/lib/i18n/formats.ts`, so
component files never call `Intl` directly.

## Adding a language

1. Add the locale code to `locales` in `src/lib/i18n/config.ts`.
2. Add `src/messages/<locale>.json` (copy `en.json` and translate) and
   `src/messages/boundary/<locale>.json`.
3. Add entries to `LOCALE_LABELS`, `LOCALE_SHORT`, `HTML_LANG` and `HREFLANG` in the same
   file, and to `LOCALE_TO_BCP47` in `src/lib/domain/currency.ts`.

That is all: routing, the language switcher, `hreflang`, the sitemap and metadata pick the
new locale up automatically. `npm test` will fail if the new catalogue has missing keys.

## Age-restricted products

The POS API has no age-restriction flag, so this is **configuration driven and off by
default**:

```env
AGE_RESTRICTION_ENABLED=true
AGE_RESTRICTED_CATEGORY_IDS=10
AGE_RESTRICTED_CATEGORY_NAMES=Cigarettes,Tobacco
AGE_RESTRICTED_PRODUCT_IDS=42,43
AGE_RESTRICTED_SKU_PREFIXES=AGE-
```

Restricted products get a badge, a notice on the product page, a note in the cart, and a
self-declaration checkbox that the Server Action enforces before the order is submitted.

Note: the API's product payload exposes `category: { id, name }` but **no category slug**,
so categories are matched by id or name. All of this lives in
`src/config/age-restriction.ts` + `src/lib/domain/age.ts` — if the POS gains a flag, only
those two files change. No legal claims are made; configure it to suit your jurisdiction.

## Caching

| Resource            | Policy                                             | Why                                                                            |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Categories          | `revalidate: 3600`, tag `categories`               | Change rarely; also a per-request saving, because the API rate-limits each key |
| Settings            | `revalidate: 3600`, tag `store-settings`           | Currency symbol and app name                                                   |
| Product list        | `revalidate: 300`, tag `products`                  | Mid-frequency                                                                  |
| Product detail      | `revalidate: 300`, tags `products`, `product:{id}` | Mid-frequency                                                                  |
| Stock               | **`no-store`**                                     | The most volatile data; must never be stale                                    |
| Orders (read/write) | **`no-store`**                                     | Customer data must never be cached                                             |

The POS enforces a **per-key per-minute rate limit and logs every request**, so caching is
not just a performance choice here — it is required for the storefront to scale.

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for a full runbook. In short:

```bash
npm ci
npm run build
NODE_ENV=production npm start      # behind nginx/Caddy with TLS
```

Back up `data/` (image mapping + uploads) alongside your database.

## Testing

```bash
npm test
```

126 tests covering: cart reducer and persistence, money rounding, stock/order status
resolution (including unknown future statuses), API normalization against the real wire
format, the API client's configuration guard and error classification, checkout validation,
image upload limits, dictionary completeness, and product-card rendering plus click-to-add
behaviour.

## Troubleshooting

| Symptom                                                                | Cause / fix                                                                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Pages show "This storefront isn't connected to the store yet"          | `API_KEY` is empty and `USE_MOCK_API=false`. Add a key or enable mock mode.                                                          |
| `Request timed out` / TLS errors against local XAMPP                   | Set `ALLOW_INSECURE_TLS=true` (development only).                                                                                    |
| `Rate limit exceeded`                                                  | The POS allows a limited number of requests per minute per key. Raise `calls_per_minute` on the key, or let the caches warm.         |
| Categories/products empty but no error                                 | The API key is missing `products.read`.                                                                                              |
| Order placed but the confirmation shows "details aren't available yet" | The key lacks `orders.read`. The order **was** created; only the lookup failed.                                                      |
| `/admin` redirects to sign-in and the password is rejected             | `ADMIN_PASSWORD_HASH` is unset or the email does not match `ADMIN_EMAIL`. Re-run `npm run admin:hash`.                               |
| Product images show the placeholder                                    | No upload exists and the POS `image_url` is empty — or a legacy _relative_ path is stored, which needs `NEXT_PUBLIC_IMAGE_BASE_URL`. |
| Sorting by price looks wrong across pages                              | Expected: the POS list endpoint has no sort parameter, so price sorting applies to the current page. See below.                      |

## Known limitations & deliberate decisions

These are honest constraints, not oversights.

**POS API limitations (the backend would need to change):**

- `GET /products` has **no `sort` parameter** — it always orders by name. Price sorting is
  therefore applied to the products on the current page, and the UI says so. Recommended
  fix: add `ORDER BY` support to `pos/api/v1/products.php`.
- `POST /orders` (v1) **does not validate stock**. The storefront re-checks live stock
  immediately before submitting, but a race window remains — the POS's own order screen
  would need to enforce the same check to close it. (`orders_v2.php` in the POS does check
  stock but is not routed.)
- `api_orders` has no columns for **delivery vs pickup, discounts, shipping or tax**, so the
  fulfilment choice and customer note are combined into the API's `note` field
  (`composeOrderNote`, one function to change if the schema gains columns).
- The `/orders` response returns `order_items` as stored JSON; `source` is only present for
  orders created through `orders_v2.php`.

**Deliberate storefront decisions:**

- **Light theme only.** Theming is a follow-up: override the semantic aliases in
  `src/styles/tokens.css`, not the palette.
- **No i18n library.** Locale routing, dictionaries and formatting are ~200 lines and avoid
  shipping an ICU runtime; plural handling uses explicit singular/plural keys.
- **Search has no suggestion endpoint.** The header search is a plain HTML form (works
  without JS) and the shop page debounces input into the URL. No request is made while you
  type beyond one per pause, and the POS's own `q` parameter does the matching.
- **`/admin` is not localized per URL.** It is an internal tool; it follows the storefront's
  language cookie and is excluded from the sitemap.
- **Service worker caches the app shell only.** It never caches product, price or stock
  responses — a stale price is worse than an offline page.
- **Multiple stores/branches, accounts, wishlists, coupons and payments are not
  implemented.** The seams are in place: payment goes through one Server Action and one
  `payment_method` field, the cart line and API layers are store-agnostic, and the order
  payload is isolated in `lib/api/orders.ts`.
