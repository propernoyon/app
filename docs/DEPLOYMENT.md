# Deployment

The storefront is a standard Next.js Node application. It works on any host that can run
`node` — a VPS, a Docker container, or a managed Node platform. It was designed for a VPS
alongside the POS (the user's chosen target).

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

## 3. Run it as a service

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

## 4. Reverse proxy + TLS

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

## 5. Backups

Two things hold state:

| What                              | Where            | Notes                          |
| --------------------------------- | ---------------- | ------------------------------ |
| Uploaded product images + mapping | `data/`          | Safe to back up while running  |
| Everything else                   | The POS database | Owned by the POS, not this app |

```bash
tar czf mini-mercado-data-$(date +%F).tar.gz -C /var/www/mini-mercado data
```

Caching is in-memory + on-disk under `.next/`; losing it is harmless.

## 6. Updating

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

## 7. Health and observability

- `GET /en` returning 200 is a reasonable liveness check.
- API failures are logged server-side as `[api] loader failed { kind, status, endpoint }`.
  If the store suddenly shows "the store is having trouble", check these first.
- Because the POS rate-limits per key and logs every request, watch `api_request_logs` in the
  POS if you raise traffic sharply (for example by lowering cache windows).

## 8. Security checklist

Before going live:

- [ ] `ALLOW_INSECURE_TLS` is **unset or false**.
- [ ] `API_KEY` is set, is not `NEXT_PUBLIC_*`, and `.env.local` is not committed
      (`.gitignore` already excludes `.env*`).
- [ ] `ADMIN_PASSWORD_HASH` and a 32+ character `ADMIN_SESSION_SECRET` are set; the dev-only
      `ADMIN_PASSWORD` fallback is removed.
- [ ] HTTPS is enforced and HSTS is on.
- [ ] `data/` is writable, and nothing else outside the app directory is.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the public origin, so canonicals and the sitemap are
      correct.
- [ ] `robots.txt` and `/sitemap.xml` are reachable and reference the production host.

## 9. Docker (optional sketch)

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
