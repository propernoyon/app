/**
 * Service worker — app shell only.
 *
 * Deliberately conservative: it never caches API responses, product pages or any
 * commerce data, because a stale price or stock level is worse than an offline
 * page. Only immutable static assets are cached, and offline navigations get a
 * small branded fallback instead of the browser's error page.
 */

const CACHE_NAME = "mini-mercado-static-v1";

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Offline</title>
    <style>
      :root {
        color-scheme: light;
        --off-bg: #fbfbfd;
        --off-fg: #1c1f26;
        --off-muted: #5f6470;
        --off-brand: #065cd7;
        --off-on-brand: #ffffff;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          color-scheme: dark;
          --off-bg: #14161a;
          --off-fg: #eceef1;
          --off-muted: #a2a8b2;
          --off-brand: #3082f6;
          --off-on-brand: #06152e;
        }
      }
      body {
        margin: 0; min-height: 100vh; display: grid; place-items: center;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        background: var(--off-bg); color: var(--off-fg); padding: 24px; text-align: center;
      }
      .card { max-width: 26rem }
      .mark {
        width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 16px;
        display: grid; place-items: center; background: var(--off-brand); color: var(--off-on-brand);
        font-size: 24px; font-weight: 700;
      }
      h1 { font-size: 1.25rem; margin: 0 0 8px }
      p { margin: 0; color: var(--off-muted); line-height: 1.6 }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="mark" aria-hidden="true">M</div>
      <h1>You're offline</h1>
      <p>Reconnect to browse the store and place an order. Your cart is saved on this device.</p>
    </div>
  </body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache anything served by our API (stock, orders, uploaded images).
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
      ),
    );
    return;
  }

  if (!isCacheableAsset(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
