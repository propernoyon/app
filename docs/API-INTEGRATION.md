# POS API integration

How this storefront talks to the MATC POS REST API, and everything that is known about that
API's contract.

The contract below was read from the POS source (`pos/api/index.php`, `pos/api/v1/*.php`,
`pos/includes/api_auth.php`) rather than guessed. Where the storefront works around a
limitation, that is called out explicitly.

---

## 1. Authentication

Every request carries the key in a header:

```http
GET /products HTTP/1.1
Host: your-pos-host
X-API-Key: <your key>
Accept: application/json
```

- Keys live in the POS `api_keys` table and are created in **Admin → API Keys**.
- A key carries a JSON `permissions` array (`["*"]` for full access). The storefront needs
  `products.read`, `orders.read` and `orders.write`.
- Keys are **rate limited per minute** (`calls_per_minute`, default 60). Every request is
  logged to `api_request_logs`, and exceeding the limit returns `429` with `Retry-After`.
- Keys can be disabled, and the owning user account can be suspended or expired — each
  produces `401` or `403`.

**The key is server-side only.** `src/lib/api/client.ts` is marked `server-only`, so an
accidental import from a Client Component fails the build. The key is never sent to the
browser, never placed in a URL, and never prefixed with `NEXT_PUBLIC_`.

Development note: Node rejects the self-signed certificate used by local XAMPP. Setting
`ALLOW_INSECURE_TLS=true` disables certificate verification for the dev process only; it is
ignored when `NODE_ENV=production`.

## 2. Response envelope

All endpoints answer with JSON, pretty-printed by the POS.

Success:

```json
{ "success": true, "...": "endpoint-specific payload" }
```

Failure:

```json
{ "success": false, "error": "Human readable message", "errors": ["optional", "field errors"] }
```

The client treats a `200` response with `success: false` as a failure, not a success.

## 3. Request flow

```text
Browser
  ↓  (same-origin fetch, form post, or RSC navigation — no API key present)
Next.js server
  ├─ Server Components read the catalogue directly through the services
  ├─ Server Actions handle order submission and admin sign-in
  └─ Route Handlers serve uploaded images and accept admin uploads
  ↓  X-API-Key
POS API
  ↓
Response → validated → normalized into domain models → rendered
```

- **Server Components** read products, categories, settings and orders directly (no HTTP
  hop, no duplicate requests — Next dedupes identical `fetch` calls within a render).
- **Route Handlers** (`/api/images/*`, `/api/admin/images`) exist only where the browser must
  initiate the request.
- **Server Actions** (`app/actions/*`) handle mutations. This is the "server function" leg of
  the architecture: the browser never talks to the POS.

## 4. Endpoints

### `GET /products`

Paginated catalogue with stock.

| Query parameter | Notes                                              |
| --------------- | -------------------------------------------------- |
| `q`             | Matches `name`, `sku` or `barcode` (`LIKE %q%`)    |
| `category_id`   | Integer                                            |
| `page`          | 1-based                                            |
| `per_page`      | 1–100, **capped at 100 server-side**               |
| `in_stock`      | `1` returns only products with `qty_available > 0` |

There is **no `sort` parameter** — the POS always emits `ORDER BY p.name ASC`. See
[Limitations](#7-known-limitations).

```json
{
  "success": true,
  "products": [
    {
      "id": 7,
      "name": "Orange Juice 1L",
      "sku": "DRK-001",
      "barcode": "5900000000007",
      "description": "…",
      "category": { "id": 2, "name": "Drinks", "color": "#2f7d4f" },
      "sell_type": "piece | box | both",
      "sale_unit": "un",
      "purchase_unit": "box",
      "pcs_per_box": 12,
      "pricing": { "sale_price": 2.35, "sale_price_box": 21.9, "tax_percent": 6 },
      "stock": {
        "qty": 36,
        "boxes": 3,
        "pieces": 36,
        "low_alert": 6,
        "status": "in_stock | low_stock | out_of_stock"
      },
      "image_url": "https://res.cloudinary.com/…/sample.jpg",
      "created_at": "2026-01-12T09:15:00+00:00",
      "updated_at": "2026-02-03T14:40:00+00:00"
    }
  ],
  "pagination": { "total": 45, "page": 1, "per_page": 20, "pages": 3 }
}
```

Notes the storefront relies on:

- `category` is **nullable** and carries no slug.
- `image_url` is a full Cloudinary URL or `null`.
- `status` may be absent in future versions; the storefront then derives it from
  `qty`/`low_alert`.
- `sale_price` can arrive as a string (`"2.35"`), because PHP encodes `DECIMAL` columns that
  way. All numbers are coerced.
- **There is no product slug.** Detail pages use `/product/{id}`.

### `GET /products/{id}`

```json
{ "success": true, "product": { …same shape as above… } }
```

Returns `404` for unknown or inactive products.

### `GET /categories`

List only — **there is no `/categories/{slug}` endpoint**.

```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "Fruits",
      "description": "Fresh fruit…",
      "color": "#e0673f",
      "icon": "apple",
      "slug": "fruits",
      "product_count": 5
    }
  ],
  "total": 1
}
```

`slug` can be empty; the storefront then derives a URL-safe slug from the name, so every
category still gets a working `/category/[slug]` page. Categories are cached for an hour.

### `GET /stock/{product_id}`

Flat (not nested) response, used for live availability.

```json
{
  "success": true,
  "product_id": 7,
  "product_name": "Orange Juice 1L",
  "unit": "un",
  "qty": 36,
  "boxes": 3,
  "pieces": 36,
  "low_alert": 6,
  "status": "in_stock",
  "last_updated": "2026-02-03 14:40:00"
}
```

### `GET /settings`

```json
{ "success": true, "settings": { "app_name": "MATC POS", "currency": "€" } }
```

`currency` is a **symbol**, not an ISO code. The storefront maps common symbols back to ISO
4217 (`€`→EUR, `৳`→BDT, `$`→USD, `£`→GBP, …) so `Intl` can format prices correctly, and
falls back to `NEXT_PUBLIC_DEFAULT_CURRENCY`. Cached for an hour.

### `POST /orders`

```json
{
  "customer": {
    "name": "Maria Silva",
    "phone": "+351 912 345 678",
    "email": "maria@example.com",
    "address": "Rua Example 1, 1200-000 Lisboa"
  },
  "items": [
    { "product_id": 5, "qty": 2, "sell_mode": "piece" },
    { "product_id": 8, "qty": 1, "sell_mode": "box" }
  ],
  "payment_method": "cash",
  "note": "Delivery · Rua Example 1 · Ring twice"
}
```

Constraints enforced by the POS:

- `items` must be a non-empty array; `product_id` and `qty` must be positive.
- `sell_mode` must be `piece` or `box`.
- `payment_method` must be one of `cash`, `bank`, `mobile`, `credit`.
- `customer.name` is required; other customer fields are optional.
- The POS re-reads `sale_price`/`sale_price_box` from its own database, so **prices are never
  sent by the client** and cannot be tampered with.

Success (`201`):

```json
{
  "success": true,
  "message": "Order submitted successfully.",
  "ref_no": "MATC-4821ABC990",
  "grand_total": 32.96,
  "items_count": 2
}
```

Reference format: `MATC-` followed by 10 random alphanumerics. Orders are stored in
`api_orders` with `status = 'pending'` and `payment_status = 'due'`.

**Important:** the live handler (`api/v1/orders.php`) does **not** validate stock. It
verifies the product exists and is active, then re-prices the line. The storefront
therefore re-checks live stock immediately before submitting (see
[Stock behaviour](#5-stock-behaviour)).

Also note `api/v1/orders_v2.php` exists in the POS but is **not routed**. It adds per-item
stock validation, discount/shipping/tax and a `WEB-` reference prefix. If it is ever routed,
only `lib/api/orders.ts` and the stock pre-check need revisiting.

### `GET /orders/{ref_no}`

```json
{
  "success": true,
  "order": {
    "ref_no": "MATC-4821ABC990",
    "date": "2026-02-03 14:40:00",
    "status": "pending",
    "payment_status": "due",
    "payment_method": "cash",
    "grand_total": 32.96,
    "note": "Delivery · Rua Example 1",
    "source": "api",
    "customer": { "name": "…", "phone": "…", "email": "…", "address": "…" },
    "items": [
      {
        "product_id": 5,
        "product_name": "Bananas",
        "sku": "FRU-001",
        "qty": 2,
        "sell_mode": "piece",
        "unit_price": 1.49,
        "total": 2.98
      }
    ]
  }
}
```

`source` is only present for orders created through `orders_v2.php`. The reference must match
`[A-Za-z0-9_-]+`; the storefront validates that before issuing the request.

**Order statuses the POS actually writes:** `pending`, `processing`, `shipped`, `completed`,
`void`. Its admin UI labels `void` as **Cancelled**. The storefront maps `void` → `cancelled`
and renders any unmapped value as "Unknown" alongside the raw string, so a future status
degrades instead of breaking the page.

## 5. Stock behaviour

Stock comes from the POS and the POS is the source of truth.

- **Displayed status** is taken from the API's `status`, or derived from `qty`/`low_alert`
  when it is missing.
- **Quantity caps** in the cart come from observed stock (`stock.qty`, or `stock.boxes` for
  box sales), so an out-of-stock product cannot be added.
- **Before submitting**, the checkout Server Action re-reads `GET /stock/{id}` for every
  product in the basket. Quantities are summed **per product** first — the same product can
  legitimately appear twice (once by the piece, once by the box), and checking each line
  independently against full stock would approve a basket that oversells.
- If anything no longer fits, the order is **not** submitted. The customer sees exactly which
  items changed, with the available quantity, and a button that adjusts the cart to match.
- Stock responses are never cached (`cache: 'no-store'`).

Residual risk: because the POS endpoint does not enforce stock, a race is still possible
between the check and the insert (for example two customers buying the last unit
simultaneously). Closing that window requires the check to live inside the POS transaction.

## 6. Error handling

Every failure becomes a typed `PosApiError` with a `kind`:

| Kind                  | Trigger                                  | Customer-facing behaviour                           |
| --------------------- | ---------------------------------------- | --------------------------------------------------- |
| `not_configured`      | `API_BASE_URL`/`API_KEY` missing         | "This storefront isn't connected to the store yet." |
| `unauthorized`        | `401`                                    | Configuration problem message; logged               |
| `forbidden`           | `403` (key lacks a permission)           | Permission message; logged                          |
| `not_found`           | `404`                                    | 404 page, or an empty state where appropriate       |
| `validation`          | `422`                                    | Field messages surfaced to the form                 |
| `rate_limited`        | `429`                                    | "Too many requests, please wait"                    |
| `bad_request`         | other `4xx`                              | Generic retry message                               |
| `server`              | `5xx`, or `success:false` on a `200`     | Retryable "store is having trouble"                 |
| `network` / `timeout` | DNS/socket failure, or the 10s timeout   | Retryable connection message                        |
| `invalid_response`    | A success response that cannot be parsed | Retryable message                                   |

Behaviour details:

- **Retries:** GETs are attempted twice on network errors and `5xx`. **POSTs are never
  retried** — creating an order is not idempotent, and a duplicate would create a second
  order.
- **Never retried:** `401`, `403`, `422`, `429` — retrying cannot help and would burn the
  rate limit.
- **Technical detail stays server-side.** Raw messages are logged with the endpoint and
  status; customers only ever see a localized sentence.
- **Unexpected failures are contained.** `tryLoad()` converts expected API failures into a
  renderable result, so a POS outage shows a friendly state with a retry instead of a 500 —
  and a production build never fails because the store was down.

## 7. Known limitations

| Limitation                                                   | Consequence                                                                                     | Suggested fix                                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| No `sort` on `GET /products`                                 | Name ascending matches the API; price sorting applies to the current page only (the UI says so) | Add `ORDER BY` support to `pos/api/v1/products.php`                               |
| No stock validation in `POST /orders` (v1)                   | A race window after the pre-check                                                               | Port `orders_v2.php`'s per-item check, or add the check inside the v1 transaction |
| No slug on products, no `/categories/{slug}`                 | Products are addressed by id; category pages resolve the slug from the cached list              | Add a slug column + endpoint                                                      |
| `api_orders` has no fulfilment/discount/shipping/tax columns | Delivery vs pickup and the customer note are merged into `note` (`composeOrderNote`)            | Add columns; only that function changes                                           |
| Currency is a single symbol per install                      | Only the display symbol is available; the ISO code is mapped                                    | Expose an ISO code in `/settings`                                                 |
| No product write endpoint                                    | Images uploaded here are stored locally, not in the POS                                         | Add a product media endpoint, or keep using Cloudinary in the POS                 |
