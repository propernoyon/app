# Deployment

The storefront is a standard Next.js Node application. It works on any host that can run
`node` — a VPS, a Docker container, or a managed platform such as Vercel.

Section 3 covers Vercel; the remaining sections cover a self-managed VPS with systemd and
nginx. The practical difference between the two is where uploaded product images live — a VPS
with a persistent disk supports the admin uploader, Vercel does not (see §3.3).

---

## 1. What you need

- Node.js **20.9+** (24 LTS recommended)
- A process manager (systemd) or PM2
- A reverse proxy with TLS: nginx, Caddy, or Apache
- Write access to a persistent directory for `data/` (uploaded images + mapping)

## 2. First deploy

```bash
git clone <your repo> /var/www/mini-mercado
cd /var/www/mini-mercado

npm ci                       # dev deps are needed: `next build` type-checks the project
cp .env.example .env.local
$EDITOR .env.local           # fill in API_*, NEXT_PUBLIC_SITE_URL, admin credentials

npm run build
NODE_ENV=production npm start        # listens on :3000
```

Environment for production:

```env
API_BASE_URL=https://your-pos-host/pos/api
API_KEY=…
USE_MOCK_API=false
ALLOW_INSECURE_TLS=false            # NEVER true in production
NEXT_PUBLIC_SITE_URL=https://shop.example.com
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=scrypt$…        # from `npm run admin:hash -- "…"`
ADMIN_SESSION_SECRET=…              # 32+ random characters
```

> `next build` runs TypeScript over the project, including the test files, so the build
> must have devDependencies present. `npm ci --omit=dev` will fail the build.

## 3. Vercel

The app is a standard Next.js project — no `vercel.json`, no `output: "standalone"`, no
native build step. Import the repo and Vercel builds it as-is.

### Environment variables

`.env*` files are gitignored and do **not** ship, so every variable has to be set in
**Project → Settings → Environment Variables** (both Production and Preview):

| Variable                     | Notes                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `API_BASE_URL`               | Public POS origin, e.g. `https://pos.example.com/api`                 |
| `API_KEY`                    | Server-only; never `NEXT_PUBLIC_`                                     |
| `USE_MOCK_API`               | `false` in production                                                 |
| `NEXT_PUBLIC_SITE_URL`       | **Must** be the real origin — see below                               |
| `NEXT_PUBLIC_STORE_NAME`     | Store display name                                                    |
| `NEXT_PUBLIC_STORE_EMAIL`    | Footer/contact. Empty renders blank                                   |
| `NEXT_PUBLIC_STORE_PHONE`    | "                                                                     |
| `NEXT_PUBLIC_STORE_ADDRESS`  | "                                                                     |
| `NEXT_PUBLIC_STORE_OPENING_HOURS` | "                                                                |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | ISO 4217 fallback, e.g. `EUR`                                       |
| `ADMIN_EMAIL`                | Operator login                                                        |
| `ADMIN_PASSWORD_HASH`        | From `node scripts/hash-admin-password.mjs "<password>"`              |
| `ADMIN_SESSION_SECRET`       | 32+ random characters — not the template value                        |
| `NEXT_PUBLIC_IMAGE_HOSTS`    | Only if product images are not on Cloudinary; read at **build** time  |

Do **not** set `ALLOW_INSECURE_TLS`. It exists solely for local XAMPP and is inert in
production, but there is no reason to carry it over.

**`NEXT_PUBLIC_SITE_URL` is the one that bites.** `src/config/env.ts` falls back to
`http://localhost:3000`, and that value flows through `absoluteUrl()` into canonicals,
`robots.txt`, `sitemap.xml` and OG tags. Forget it and the live site advertises localhost
URLs to crawlers. After deploying, confirm:

```bash
curl -s https://your-domain/sitemap.xml | head
curl -s https://your-domain/robots.txt
```

**`ADMIN_PASSWORD_HASH` has no production fallback.** The plaintext `ADMIN_PASSWORD` path is
disabled when `NODE_ENV=production` (see `src/lib/admin/session.ts`), so without a hash the
admin login stays unconfigured no matter what else is set.

### Product images

`next.config.ts` allow-lists Cloudinary, plus anything named in `NEXT_PUBLIC_IMAGE_HOSTS`.
If the POS returns product images from any other host, `next/image` throws at runtime on live
product pages — not at build time, so it will not fail the deploy. The variable is read while
the config is evaluated, which makes it a build-time value: set it, then redeploy.

### Image uploads do not work on Vercel

The admin uploader writes to `<cwd>/data/` (`src/lib/images/store.ts`). Vercel's filesystem is
read-only outside `/tmp`, which is ephemeral and per-instance. On Vercel, therefore:

- `POST /api/admin/images` fails with HTTP 500 `storage_failed`
- `GET /api/images/[id]/[hash]` always 404s
- the mapping at `data/product-images.json` is always empty

**The storefront is unaffected.** `getImageResolver` falls back to the POS/Cloudinary URL for
every product, so browsing and ordering behave normally — only the admin "override this
product's image" feature is unavailable.

If you want it later, move `src/lib/images/store.ts` onto external object storage (Vercel Blob,
S3/R2, or Cloudinary uploads). The interface is small and isolated, so only that module and
the two route handlers change.

Vercel also caps a function's request body at **4.5 MB**, below this app's 5 MB
`IMAGE_UPLOAD_MAX_BYTES` default — lower it if uploads are ever enabled there.

### Not needed

No `vercel.json`, no cron, no edge runtime. `src/proxy.ts` runs on the Node runtime and reads
no host header, the admin session is a stateless HMAC cookie backed by no local files, and
`sharp` resolves the correct Linux binary automatically.

## 4. Run it as a service

`/etc/systemd/system/mini-mercado.service`:

```ini
[Unit]
Description=Mini Mercado storefront
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mini-mercado
EnvironmentFile=/var/www/mini-mercado/.env.local
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start
Restart=always
RestartSec=5

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/var/www/mini-mercado/data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now mini-mercado
sudo systemctl status mini-mercado
```

Note `ReadWritePaths` — the app writes uploads to `data/`, so that path must stay writable
while the rest of the tree can be read-only.

## 5. Reverse proxy + TLS

nginx (Caddy is simpler if you have the choice — it provisions certificates automatically):

```nginx
server {
    listen 443 ssl http2;
    server_name shop.example.com;

    ssl_certificate     /etc/letsencrypt/live/shop.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shop.example.com/privkey.pem;

    # Uploaded images can be a few MB.
    client_max_body_size 6m;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    # Next serves immutable, content-hashed assets.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name shop.example.com;
    return 301 https://$host$request_uri;
}
```

> The admin sign-in rate limiter reads `X-Forwarded-For`. Make sure the proxy sets it, or
> every request will look like it comes from the proxy.

## 6. Backups

Two things hold state:

| What                              | Where            | Notes                          |
| --------------------------------- | ---------------- | ------------------------------ |
| Uploaded product images + mapping | `data/`          | Safe to back up while running  |
| Everything else                   | The POS database | Owned by the POS, not this app |

```bash
tar czf mini-mercado-data-$(date +%F).tar.gz -C /var/www/mini-mercado data
```

Caching is in-memory + on-disk under `.next/`; losing it is harmless.

> On Vercel there is nothing to back up — `data/` does not persist. The POS database and
> whatever object storage you use for images become the only stateful pieces.

## 7. Updating

```bash
cd /var/www/mini-mercado
git pull
npm ci
npm run build
sudo systemctl restart mini-mercado
```

Zero-downtime is not configured out of the box; a few seconds of restart is normally
acceptable for a grocery storefront. If you need it, run two instances on different ports
and switch the proxy upstream.

## 8. Health and observability

- `GET /en` returning 200 is a reasonable liveness check.
- API failures are logged server-side as `[api] loader failed { kind, status, endpoint }`.
  If the store suddenly shows "the store is having trouble", check these first.
- Because the POS rate-limits per key and logs every request, watch `api_request_logs` in the
  POS if you raise traffic sharply (for example by lowering cache windows).

## 9. Security checklist

Before going live:

- [ ] `ALLOW_INSECURE_TLS` is **unset or false**.
- [ ] `API_KEY` is set, is not `NEXT_PUBLIC_*`, and `.env.local` is not committed
      (`.gitignore` already excludes `.env*`).
- [ ] `ADMIN_PASSWORD_HASH` and a 32+ character `ADMIN_SESSION_SECRET` are set; the dev-only
      `ADMIN_PASSWORD` fallback is removed.
- [ ] HTTPS is enforced and HSTS is on.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the public origin, so canonicals and the sitemap are
      correct.
- [ ] `robots.txt` and `/sitemap.xml` are reachable and reference the production host.
- [ ] (VPS only) `data/` is writable, and nothing else outside the app directory is.

## 10. Docker (optional sketch)

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

Mount a volume at `/app/data` so uploads survive container replacement. (If you adopt
`output: 'standalone'`, remember to copy `.next/static` and `public/` into the runtime
image.)
