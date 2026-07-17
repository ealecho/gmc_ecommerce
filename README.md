# RawBlocks

A streetwear e-commerce app built with React + Vite on the frontend and a [Hono](https://hono.dev) API running on [Cloudflare Workers](https://workers.cloudflare.com). Data and auth are powered by [Neon](https://neon.tech) (Postgres + Neon Auth).

Live: https://rawblocks.faizintifada.com

## Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS v4, Framer Motion
- **Language:** TypeScript (Strict Mode)
- **API:** Hono on Cloudflare Workers (`worker/`)
- **Database:** Neon (serverless Postgres) via `@neondatabase/serverless`
- **Auth:** Neon Auth (JWT verified with `jose` against a JWKS endpoint)
- **Payments:** [Mayar](https://mayar.id) hosted checkout (single payment request + webhook reconciliation)
- **Media:** Cloudflare R2 (product image uploads, served back via the Worker)
- **Tooling:** Vite 8 + `@cloudflare/vite-plugin`, Wrangler

## Architecture

This is a single fullstack Cloudflare Worker:

- `worker/index.ts` mounts the Hono app and routes all `/api/*` requests.
- Static assets (the built React SPA) are served by Cloudflare Assets. Unmatched non-API routes fall back to `index.html` so the client-side router works.
- `run_worker_first = ["/api/*"]` in `wrangler.toml` ensures API requests always hit the Worker and are never swallowed by the SPA fallback.
- Product images are uploaded to a Cloudflare R2 bucket (`MEDIA` binding) and served back through `/api/media/*`.

```
worker/
  index.ts          # Hono app, mounts /api routes
  types.ts          # TypeScript interfaces for Bindings and environment
  lib/
    db.ts           # Neon client (per-request, from env) + row mappers
    auth.ts         # JWT verification + profile/role resolution
    errors.ts       # ApiError + JSON error responses
    mayar.ts        # Mayar API client (create payment request, get payment status)
  routes/
    products.ts     # GET/POST /api/products, PATCH/DELETE /api/products/:id, PATCH /api/products/reorder
    cart.ts         # GET/PUT/PATCH/DELETE /api/cart
    orders.ts       # GET/POST /api/orders (creates a Mayar payment on checkout)
    payments.ts     # POST/GET /api/payments/webhook/:token (Mayar webhook)
    me.ts           # GET /api/me
    media.ts        # POST /api/media (upload), GET /api/media/* (serve)
```

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/products` | none | List active products, sorted by manual order (`?includeInactive=true` requires admin) |
| `POST` | `/api/products` | admin | Create a product (appended to the end of the manual order) |
| `PATCH` | `/api/products/reorder` | admin | Persist a manual product ordering (`{ ids: [...] }`) |
| `PATCH` | `/api/products/:id` | admin | Update a product |
| `DELETE` | `/api/products/:id` | admin | Delete a product (also removes its managed R2 image) |
| `POST` | `/api/media` | admin | Upload a product image (`multipart/form-data`, `file` field; JPEG/PNG/WebP/AVIF/GIF, max 5 MB) |
| `GET` | `/api/media/*` | none | Serve an uploaded image |
| `GET` | `/api/me` | user | Current user + role |
| `GET` | `/api/cart` | user | Get cart items |
| `PUT` | `/api/cart` | user | Set item quantity |
| `PATCH` | `/api/cart` | user | Adjust item quantity by delta |
| `DELETE` | `/api/cart` | user | Remove an item (`?productId=`) or clear cart |
| `GET` | `/api/orders` | user | List orders |
| `POST` | `/api/orders` | user | Create an order from the cart and a Mayar payment request (returns `paymentLink`) |
| `POST` | `/api/payments/webhook/:token` | token | Mayar webhook (`payment.received`); verifies with Mayar then marks the order `paid` |
| `GET` | `/api/payments/webhook/:token` | token | Webhook health check (returns `{ ok: true }` for a valid token) |

## Payments (Mayar)

Checkout is processed through [Mayar](https://mayar.id) hosted checkout:

1. `POST /api/orders` creates a `pending` order from the cart, then calls Mayar
   `POST /hl/v1/payment/create` and stores the returned payment id, transaction
   id, and hosted checkout link on the order.
2. The client redirects the customer to the Mayar `paymentLink`.
3. After payment, Mayar sends a `payment.received` event to
   `POST /api/payments/webhook/:token`. The Worker authenticates the callback
   via the secret `:token` in the URL, then **verifies the payment status
   directly against the Mayar API** (`GET /hl/v1/payment/{id}`) before flipping
   the order to `paid`. This defends against spoofed webhooks since Mayar does
   not sign webhook bodies.
4. Mayar redirects the customer back to `/orders?order=<id>`, which polls until
   the order shows as `paid`.

**Environment switch:** `MAYAR_ENV` selects the API base URL — `production`
uses `https://api.mayar.id`, anything else (default) uses the sandbox
`https://api.mayar.club`. `MAYAR_API_URL` can override the base URL explicitly.

**Registering the webhook:** in the Mayar dashboard (Integration → Webhook),
set the URL to:

```
https://<your-site>/api/payments/webhook/<MAYAR_WEBHOOK_TOKEN>
```

For local development, expose your dev server with a tunnel (e.g. `cloudflared`)
and register that tunnel URL, since Mayar cannot reach `localhost`.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) project with Neon Auth enabled

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Two sets of variables are used:

- **Client (`VITE_*`)** — live in `.env`, exposed to the browser by Vite.
- **Server secrets** — live in `.dev.vars` for local dev (read by the Worker), and are set as Wrangler secrets in production.

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Then create a `.dev.vars` file with the server-side secrets used by the Worker:

```
DATABASE_URL="postgresql://...@...neon.tech/neondb?sslmode=require"
NEON_AUTH_JWKS_URL="https://<your-neon-auth-domain>/.well-known/jwks.json"
ADMIN_EMAIL="you@example.com"
NEON_AUTH_ISSUER=""
NEON_AUTH_AUDIENCE=""

# Mayar payment gateway
MAYAR_API_KEY="<your Mayar API key>"
MAYAR_ENV="sandbox"            # 'production' uses api.mayar.id; otherwise sandbox
MAYAR_WEBHOOK_TOKEN="<random secret used in the webhook URL>"
```

> `MAYAR_API_KEY` comes from web.mayar.club (sandbox) or web.mayar.id
> (production) → Integration → API Key. `MAYAR_WEBHOOK_TOKEN` is any random
> string you choose; it authenticates the webhook callback. In production,
> `PUBLIC_BASE_URL` (the site origin used to build payment redirect URLs) should
> also be set — locally it defaults to the request origin.

> `.env` and `.dev.vars` are gitignored. Never commit secrets.

### 3. Apply the database schema

Run the migrations in `migrations/` against your Neon database in order (e.g. via the Neon SQL editor or `psql`):

- `001_initial_neon.sql` — initial schema (products, cart, orders, etc.)
- `002_product_sort_order.sql` — adds manual product ordering (`sort_order`)
- `003_idr_currency.sql` — converts stored monetary values from USD cents to whole IDR rupiah
- `004_mayar_payment.sql` — adds Mayar payment fields to `orders` (`payment_id`, `payment_transaction_id`, `payment_link`, `paid_at`, etc.)

> Monetary `*_cents` columns hold whole Indonesian rupiah (IDR), not sub-units. Migration `003` is idempotent-guarded via a `schema_migrations` marker, so it won't double-convert on re-run.

### 4. Create the R2 bucket (for image uploads)

Product images are stored in Cloudflare R2 under the `MEDIA` binding (see `wrangler.toml`). Create the bucket once:

```bash
wrangler r2 bucket create rawblocks-media
```

### 5. Run locally

```bash
npm run dev
```

The Cloudflare Vite plugin runs the Worker (API) and the React app together on a single dev server, so `/api/*` behaves exactly as it does in production.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (frontend + Worker API) |
| `npm run build` | Build the client and Worker bundles |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run typecheck`| Run TypeScript compiler to typecheck without emitting files |
| `npm run lint` | Run ESLint |

## Deployment

Deploys to Cloudflare Workers via Wrangler. Configuration lives in `wrangler.toml`.

### Create the R2 bucket (once)

```bash
wrangler r2 bucket create rawblocks-media
```

### Set production secrets (once)

Secrets are not read from `.dev.vars` in production — set them explicitly:

```bash
wrangler secret put DATABASE_URL
wrangler secret put NEON_AUTH_JWKS_URL
wrangler secret put ADMIN_EMAIL
wrangler secret put MAYAR_API_KEY
wrangler secret put MAYAR_WEBHOOK_TOKEN
wrangler secret put PUBLIC_BASE_URL
```

(Set `NEON_AUTH_ISSUER` / `NEON_AUTH_AUDIENCE` too if your Neon Auth setup uses them. `MAYAR_ENV` is a non-secret var in `wrangler.toml` — set it to `production` for live payments.)

### Deploy

```bash
npm run deploy
```
