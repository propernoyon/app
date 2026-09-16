# Architecture & decisions

Why the storefront is built the way it is. Each decision lists the trade-off it accepts.

---

## 1. Server-first rendering

**Decision.** Server Components are the default. `"use client"` appears only where
interaction requires it: the cart, quantity steppers, the shop filter toolbar, the language
switcher, mobile navigation, toasts, dialogs, the image manager and the service-worker
registrar.

**Why.** The catalogue is the same for every visitor, so rendering it on the server removes
product data from the JavaScript bundle, keeps prices formatted server-side, and makes the
first paint meaningful without waiting for a fetch waterfall.

**Trade-off.** Interactive affordances are split across a server/client boundary, which
requires care with what can cross it — functions cannot. Paths are passed to client
components as strings (for example `productHrefBase`) rather than callbacks.

## 2. One API layer, and the key never leaves the server

```text
Browser → Server Component | Server Action | Route Handler → POS API
```

**Decision.** `src/lib/api/client.ts` is the only module that reads `API_KEY`, and it is
marked `server-only` so importing it into a Client Component fails the build. Pages read
data straight from the services rather than through their own HTTP endpoints.

**Why.** The brief's hard requirement is that the browser never sees the key. Going direct
from Server Components also removes a network hop and lets Next dedupe identical requests.

**Trade-off.** Server-only modules are harder to unit test. The test runner aliases
`server-only` to an empty module (`src/test/server-only-stub.ts`) so the client's guard and
error classification can still be exercised.

## 3. Adapters absorb API shape changes

**Decision.** `schemas.ts` (zod) describes the wire format; `normalize.ts` maps it into
camelCase domain models. Envelopes are accepted as `{products}`, `{data}` or a bare array,
numbers are coerced, and each list item parses independently.

**Why.** The storefront must not break when the POS changes. One malformed product should
cost one product, not a page. And the mapping is the only place that knows about
`pricing.sale_price`.

**Trade-off.** Two representations exist (wire + domain). That is the point: components only
ever see the domain model.

## 4. Expected failures are values, not exceptions

**Decision.** `tryLoad()` returns `{ ok: true, data }` or `{ ok: false, error }` for API
failures, which pages render as a friendly, localized state with a retry. Unexpected errors
still throw into `error.tsx`.

**Why.** API outages are a normal operating condition for a storefront. Treating them as
values means graceful degradation, per-section error states, and — importantly — a build
that does not fail because the POS was unreachable during prerendering.

**Trade-off.** Two error paths exist (`tryLoad` results and `error.tsx`). The rule is:
_expected_ API failure → value; bug → boundary.

## 5. Cart as an external store

**Decision.** The cart is a module-level store with a pure reducer, read through
`useSyncExternalStore`, persisted to `localStorage`, and synchronised across tabs via the
`storage` event.

**Why.** A `useEffect` hydration causes a flash and a hydration mismatch. `useSyncExternalStore`
gives a deterministic server snapshot (always empty), reads `localStorage` only in a
subscription, and keeps the reducer pure and testable.

**Trade-off.** Cart lines carry a _display snapshot_ (name, price, image). These are
presentation-only: prices are re-read server-side at checkout, so a stale snapshot can never
change what is charged.

**Stock semantics.** `maxQuantity: 0` means "none available" (the line is dropped);
`null` means "unknown" (unbounded). Conflating the two was a real bug caught by a test.

## 6. Money

**Decision.** `lineTotal` rounds per line to two decimals, then `sumMoney` rounds the sum —
mirroring the POS's own `round($unitPrice * $qty, 2)`.

**Why.** The totals the customer sees must match the totals the POS recalculates and stores,
or the confirmation page will contradict the cart.

## 7. i18n without a library

**Decision.** `app/[locale]/` is the root layout (so `locale` becomes a root parameter),
`proxy.ts` negotiates the locale, dictionaries are typed from `en.json`, and formatting goes
through `src/lib/i18n/formats.ts`.

**Why.** It is roughly 200 lines, ships no ICU runtime to the browser, and keeps messages
statically analysable. Deriving the `Dictionary` type from `en.json` turns a missing key into
a compile error, and reading messages as `dict.common.addToCart` means typos cannot silently
render a key name.

**Trade-off.** No ICU plural syntax; counts use explicit singular/plural keys
(`cart.itemCountOne` / `cart.itemCount`) via a `pluralize` helper.

**Locale access.** Server Components read the locale through `next/root-params` in
`getStoreContext()`. Server Actions and Route Handlers cannot use root params, so they
receive the locale explicitly — which is why `submitOrderAction` reads it from the form.

**Error boundaries are the exception.** `error.tsx` is a Client Component and cannot await
the dictionary, so `messages/boundary/*.json` holds the handful of strings it needs rather
than bundling whole catalogues for a screen that almost never renders.

## 8. Design system

**Decision.** `src/styles/tokens.css` is the single source of truth, exposed to Tailwind v4
through `@theme`. Components compose classes with `cn()` (clsx + tailwind-merge) and never
hard-code colours, radii or shadows. A dev-only `/dev/ui` styleguide renders every primitive
in every state.

**Why.** "Standard UI" only survives if there is one place to change it. The styleguide is
the artefact that makes drift visible — and it is excluded from production and from
`robots.txt`.

**Trade-off.** Custom semantic type utilities (`text-h1`, `text-body`) sit alongside
Tailwind's scale, so contributors must prefer the semantic ones.

**Deliberately light-only.** A half-tested dark theme is worse than none. Theming means
overriding the _semantic_ aliases, not the palette.

## 9. Accessibility and UX as build gates, not polish

- Native `<dialog>` powers modals, so focus trapping, Esc handling, background inerting and
  focus restoration come from the platform.
- One global `:focus-visible` treatment; touch targets are ≥44px; inputs are ≥16px on mobile
  to prevent zoom-on-focus.
- Every interactive element defines default/hover/focus/active/disabled states and never
  shifts layout on press.
- Every async surface has four designed states: loading (a skeleton matching the final
  layout), empty, error and success.
- `prefers-reduced-motion` is honoured globally.
- Errors are announced (`role="alert"`) while calm updates are polite (`role="status"`).

## 10. Performance

- Long-cached categories/settings, mid-cached products, never-cached stock and orders.
- `next/image` with explicit `sizes` on every call site, lazy by default, `priority` only on
  the hero and the first above-the-fold row; aspect-ratio boxes prevent layout shift.
- Fonts are self-hosted by `next/font` with `display: swap`.
- No third-party scripts, no analytics, no UI kit.
- Client bundles stay small because prices are formatted on the server and dictionaries never
  cross the boundary.

## 11. Security model

| Surface        | Control                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| POS API key    | Server-only module; never `NEXT_PUBLIC_`; never in a URL                                                                                              |
| Admin access   | HMAC-signed `httpOnly` session cookie; scrypt password; constant-time comparison; rate-limited sign-in; re-verified in every page, action and handler |
| Redirects      | `proxy.ts` is a convenience check only, never the access control                                                                                      |
| Image upload   | Sized → magic-byte sniffed → decoded by sharp → re-encoded to WebP → written under a generated name                                                   |
| Path traversal | File names are generated; the mapping discards any entry containing a path separator; the serving route verifies the hash                             |
| User input     | zod-validated at the checkout boundary; client-supplied prices are ignored entirely                                                                   |
| XSS            | React escaping everywhere; JSON-LD is serialized with `<` escaped                                                                                     |
| CSRF           | Server Actions are same-origin-checked by the framework; the session cookie is `SameSite=Lax`                                                         |
| Secrets in git | `.env*` ignored; `.env.example` carries no real values                                                                                                |

## 12. Extensibility seams

Places designed to change without a rewrite:

- **Payments** — one Server Action (`submitOrderAction`), one `payment_method` field, one
  payload builder (`toOrderPayload`). Adding a gateway means adding a step before the POST.
- **Accounts / order history** — the order model and tracking page already read by reference;
  an account would add a lookup dimension, not a new flow.
- **Multiple stores / branches** — the API key is multi-tenant (`user_id`) on the POS side;
  the client and services are store-agnostic.
- **Delivery zones / fees** — computed in `composeOrderNote` today; would become its own
  module feeding the payload.
- **Promotions / coupons** — `api_orders` has no discount column, so this depends on the
  backend (`orders_v2.php` already supports `discount_amount`).
- **Age restrictions** — two files (`config/age-restriction.ts`, `domain/age.ts`) swap to an
  API flag.
- **New languages** — one config entry plus one message file.
