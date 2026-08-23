# AGENTS.md

Guide for AI agents (and humans) working on this repository.

## Project Overview

**collectina** — the official e-commerce store of the Persian streetwear/brand. Sells two product types:

- **قاب موبایل (phone cases)** — design prints for 300+ phone models
- **پوستر (posters)** — wall art prints

The entire UI is **Persian (fa) and RTL**. All user-facing copy is Persian.
The storefront is dark-themed by default (`next-themes` with `defaultTheme="dark"`).

Current version: 2.5.0 (package.json `version`; git tags mirror releases as `2.5.0`, `2.4.0`, …).

## Tech Stack

| Area             | Choice                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework        | Next.js 16 (App Router, React Server Components), React 19                                                   |
| Language         | TypeScript (strict), path alias `@/*` → project root                                                         |
| Styling          | Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`), `tw-animate-css`, shadcn/ui (new-york style) |
| UI primitives    | Radix UI via `components/ui/*` (shadcn), `lucide-react` icons                                                |
| Backend/DB/Auth  | PostgreSQL (via `postgres`/postgres.js), Better Auth (phone+password) |
| Payments         | Modular gateway system (`lib/payments/`): Zibal (direct API), extensible to PayPing, card-to-card, etc.       |
| Hosting          | Vercel (`.vercel/`) and/or Liara (`liara.json`)                                                              |
| Animation        | framer-motion, embla-carousel, swiper                                                                        |
| Forms/validation | zod (used directly in checkout), react-hook-form (installed, not used in checkout)                           |
| Misc             | sonner (toast), html-to-image (mockup export), recharts, vaul, cmdk                                          |

No test framework is configured. No ESLint config present despite a `lint` script.

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # next lint (no eslint config installed)
npx tsc --noEmit # manual typecheck (build does NOT typecheck — see Gotchas)
```

## Project Structure

```
app/
  layout.tsx                # Root layout: RTL, fa, Rubik font, ThemeProvider, Toaster, Vercel Analytics, enamad meta
  globals.css               # Tailwind v4 + CSS vars (oklch), light/dark themes
  not-found.tsx             # 404 (client component, includes Header)
  robots.ts / sitemap.ts    # SEO (disallow /api /dashboard /cart /admin)
  (site)/(main)/            # Public storefront — layout renders <Header/> + <main max-w-5xl>
    page.tsx                # Home: feature flags from settings (show_poster/show_phonecase), TopBanner, grids
    cart/page.tsx           # Cart + checkout (client)
    phonecase/page.tsx, poster/page.tsx            # Grid listing pages
    phonecase/[id]/page.tsx, poster/[id]/page.tsx  # Product detail (server) → selectors
    phonecase/custom/page.tsx, poster/custom/page.tsx  # Admin-only custom upload pages
    about/, support/        # Static content
    card-to-card/[orderId]/ # Card-to-card payment page (two-step: details → receipt upload)
  (site)/(dashboard)/       # Auth-required; layout has its own header w/ user info
    dashboard/page.tsx      # User dashboard: stats + order list
    dashboard/me/page.tsx   # Profile form + logout
    dashboard/admin/page.tsx        # Admin overview + recent orders (copy-to-clipboard payloads)
    dashboard/admin/mng/            # Admin CRUD: products / phone-cases / posters / settings managers
    dashboard/admin/recent-orders-client.tsx
    dashboard/mockup/page.tsx       # Exports product mockup images via html-to-image
  (auth)/auth/              # login + signup (phone + password, phone normalized to +98…)
  (status)/                 # order-success, order-failed, track/[track] (public order tracking)
  api/
    auth/[...all]/        # Better Auth API route handler
    cart/                  # Cart CRUD + count
    checkout/              # Server-side checkout flow (orders, payment)
    discount/validate/     # Discount code validation
    products/              # Product listing + detail
    profile/               # User profile CRUD
    settings/              # Public settings
    upload/                # Image upload via StorageProvider
    admin/                 # Admin CRUD (products, phone-cases, posters, settings)
    payment/request|start|verify|gateways|card-details|upload-receipt  # Payment flow routes (see Payment section)
    orders/[orderId]/|status/   # Order detail + status update (card-to-card flow)
components/
  ui/                       # shadcn/ui primitives (button, dialog, select, toast, …)
  product/                  # product-detail-shell, product-purchase-dock, product-visual-stage, …
  header.tsx                # Fixed pill header, hamburger menu, live cart badge (listens to "cart-updated" event)
  checkout-form.tsx         # THE checkout core (validation, discount, order creation, payment)
  payment-method-selector.tsx  # Gateway selector UI in checkout (radio cards)
  cart-item.tsx, cart-price-summary.tsx, cart-shipping-notice.tsx, cart-poster-suggestion.tsx
  phonecase-grid.tsx, poster-grid.tsx     # Infinite-scroll grids (feed=true, ordered by pin, created_at)
  phonecaseCard.tsx, poster-card.tsx      # Product images; cards render without link when no href
  phone-case-selector.tsx, poster-selector.tsx  # Add-to-cart selectors on product pages
  order-progress.tsx, track-page-client.tsx     # Order status timeline / tracking page
  admin-bar.tsx             # Floating admin shortcut (mockup export) on product pages
  top-banner.tsx, banner1.tsx, banner2.tsx, home-bridge.tsx, home-category-nav.tsx, …
features/custom/            # Admin-only custom design upload flow (image → storage → product)
  custom-phonecase-page-client.tsx, custom-phonecase-selector.tsx (exports uploadAndCreateProduct)
  custom-poster-page-client.tsx, custom-poster-selector.tsx
lib/
  cache.ts                  # In-process TTL cache: settings, phone-case/poster catalogs, product feed pages
  db/pool.ts                # postgres.js connection pool (DATABASE_URL)
  auth.ts                   # Better Auth server config (phone+password, postgresql adapter)
  auth-client.ts            # Better Auth client (browser-side, signIn.phoneNumber, useSession)
  auth-helpers.ts           # getCurrentUser(), isAdmin(), requireAuth() for server code
  repositories/             # Typed SQL query modules (Product, Variant, Cart, Order, User, Discount, Settings)
  storage/                  # StorageProvider interface + S3StorageProvider (+ optional SupabaseStorageProvider fallback)
  payments/                 # Modular payment gateway system (see Payment section)
    types.ts                # PaymentGateway interface + shared types
    registry.ts             # PaymentRegistry: manages gateways, singleton access
    gateways/               # Gateway implementations
      zibal.ts              # Zibal direct API integration
  types/database.ts         # TS interfaces: all tables + composite types (strict, matches schema.sql)
  types/order-status.ts     # Single source of truth: OrderStatus type + labels, badge classes, icons, timeline steps
  shipping.ts               # Shipping groups: poster + phonecase = 2 shipments, fee per group
  zibal-proxy.ts            # [DEPRECATED] Legacy proxy wrapper, now uses gateway system
  utils.ts                  # cn() helper
constants/index.ts          # MENU_ITEMS nav list
helpers/should-i-render.ts  # Reads settings (show_poster, show_phonecase, top_banner)
hooks/                      # use-logout, use-phone-formatter, use-resize-observer-height, use-toast
server/payment-proxy/       # [DEPRECATED] Legacy PHP proxy files (no longer needed)
scripts/schema-complete.sql   # SINGLE FILE — run this on fresh PostgreSQL (creates everything)
scripts/migrations/           # Incremental SQL for the production DB (e.g. 2026-08-20-product-feed-index.sql)
docs/zibal-proxy-setup.md   # Full Zibal proxy architecture doc (Persian)
proxy.ts                    # Next.js proxy (middleware equivalent) — session refresh + route guard
```

## Auth & Route Protection

- Auth is **phone + password** via Better Auth (`lib/auth.ts`). Login/signup convert `0912…` → `+98912…`.
- Better Auth manages its own `user`, `session`, `account`, and `verification` tables.
- `proxy.ts` (root; Next 16 renamed `middleware.ts` → `proxy.ts`) refreshes the session on
  every request and enforces:
  - `/dashboard*` and `/checkout*` → redirect to `/auth/login` if logged out
  - `/auth/login` and `/auth/signup` → redirect to `/` if logged in
- **Admin access** is gated everywhere by `user.phone === process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER`
  (dashboard admin page, admin mng, custom pages, AdminBar, admin-only grid flags). There is no roles table.
- Server components use `getCurrentUser()` from `@/lib/auth-helpers`; client components use
  `useSession()` from `@/lib/auth-client`.


## Payment Flow (Modular Gateway System)

The payment system uses a modular gateway architecture (`lib/payments/`) that supports multiple
Iranian payment gateways. Currently implemented: **Zibal** (direct API, no proxy needed).

### Architecture

```
lib/payments/
  types.ts              # PaymentGateway interface + shared types
  registry.ts           # PaymentRegistry: manages gateways, singleton access
  gateways/
    types.ts            # Same types (re-exported)
    zibal.ts            # Zibal direct API integration
    index.ts            # Gateway exports
  index.ts              # Module entry point
```

### Adding a New Gateway

1. Create `lib/payments/gateways/payping.ts` implementing `PaymentGateway` interface
2. Export `createPayPingGateway()` factory function
3. Register in `lib/payments/registry.ts` `initializeGateways()`
4. Add env vars (e.g., `PAYPING_MERCHANT_ID`)

### Flow (all initiated from `components/checkout-form.tsx`)

1. User fills shipping form (zod-validated: Persian name/city, 11-digit `09…` phone, 10-digit postal code, address, optional telegram).
2. Discount code (optional) validated client-side against `discounts` + `discount_usages` tables.
3. On submit: `POST /api/checkout` → creates `orders` row (`status='pending'`) + `order_items` rows,
   updates `profiles`, then calls `registry.createRequest()` directly (no internal API call).
4. `getPaymentRegistry().createRequest()` → `ZibalGateway.createRequest()`
   → `POST https://gateway.zibal.ir/v1/request` with `{ merchant, amount (Rials), callbackUrl, orderId }`.
5. On `result === 100`, returns `paymentUrl` → user redirects to `https://gateway.zibal.ir/start/{trackId}`.
6. Zibal redirects the browser back to `{NEXT_PUBLIC_APP_URL}/api/payment/verify?success=1&trackId=…&orderId=…`.
7. `app/api/payment/verify/route.ts` → `registry.verify()` → `ZibalGateway.verify()`
   → `POST https://gateway.zibal.ir/v1/verify`; on success sets order `status='paid'`,
   deletes cart, redirects to `/order-success?orderId=…`; otherwise `/order-failed?orderId=…`.

### Environment Variables

```env
ZIBAL_MERCHANT_ID=      # Required: Your Zibal merchant ID
ZIBAL_SANDBOX=true      # Optional: Use Zibal sandbox for testing
NEXT_PUBLIC_APP_URL=https://collectina.ir  # Used for callback URLs
```

### Legacy Proxy Support

The old PHP proxy solution (`lib/zibal-proxy.ts`) is deprecated but kept for backward compatibility.
It now wraps the new gateway system. The `server/payment-proxy/` files are no longer needed.

Note: the Zibal **trackId** is stored in `orders.payment_reference` (written by checkout).
`orders.track_id` is a separate int4 used as the user-facing order number (`#…`) but is **never
written by the app** — it's populated outside the app (DB trigger/manual; unverified). Postal
tracking (`track_post_id`) is set manually by the admin.

## Database (PostgreSQL)

**Setup on fresh PostgreSQL:**
```bash
# One command — creates everything (auth tables + business tables + indexes)
psql $DATABASE_URL -f scripts/schema-complete.sql
```

**`scripts/schema-complete.sql`** is the single file — creates ALL tables:
- Better Auth tables (`"user"`, `session`, `account`, `verification`)
- Business tables (`profiles`, `products`, `orders`, `cart_items`, etc.)
- Functions (`generate_track_id`, `handle_new_user` trigger)
- Indexes

No RLS policies (auth is handled at the app layer via Better Auth + API routes).
Columns, exact types (incl. the `discount_type` enum), NOT NULL flags, and defaults were
verified against production on 2026-08-18 via the **service_role** key (PostgREST OpenAPI spec

- type probes). RLS policy bodies and function bodies are marked `[RECONSTRUCTED]`; the file
  ends with SQL to dump the exact live policies from the SQL editor. The old numbered migrations
  (001–011) were removed.

Tables in use:

- **profiles** — id (→ auth.users), display_name (nullable), phone_number, address, city, postal_code, telegram, **beta_og** (bool default false), created_at, updated_at
- **products** — id, name (nullable), description, image_url, designer (uploader uuid), type (`'phonecase' | 'poster'`, nullable), **feed** (default **true**), **pin** (default false), created_at, updated_at
- **phone_cases** — id, brand, model, price `numeric(10,2)`, available (NOT NULL default **false**), unique(brand, model)
- **posters** — id, attribute (nullable), **price is TEXT** (`"50000"` — quirk, verified), available (NOT NULL, no default), created_at (no updated_at)
- **cart_items** — id, user_id, product_id, quantity (default 1), phone_case_id?, poster_id?
- **orders** — id, user_id, total_amount `numeric(10,2)`, status (text, default 'pending'), payment_reference (Zibal trackId), shipping_address/city/postal_code, phone_number, telegram?, receiver_name (nullable), **track_id int4 NOT NULL**, track_post_id?, discount_id?, discount_amount (plain numeric, default 0), free_shipping, note?, created_at, updated_at (payment_status was dropped)
- **order_items** — id, order_id, product_id, product_name, product_price `numeric(10,2)`, quantity, phone_case_id?, phone_brand?, phone_model?, poster_atr?, poster_id?, created_at
- **discounts** — code, **type enum `public.discount_type`** (`percentage | fixed | free_shipping`), value/min/max plain numeric, is_active, starts_at, expires_at, usage_limit int, usage_per_user int, created_at (no updated_at)
- **discount_usages** — discount_id, user_id, **order_id (NOT NULL)**, used_at (NOT created_at)
- **discount_usage_stats** — VIEW: discount_id, total_usage (bigint)
- **otps** — id, phone, code, created_at, expires_at (dormant — current auth is phone+password)
- **settings** — single row `{id int8 identity, post_price numeric, top_banner, show_poster, show_phonecase}` — NO timestamps

Known quirks (all documented in schema.sql):

- `orders.track_id` (the user-facing `#…` number) is **int4 NOT NULL + UNIQUE, the app never
  writes it, and there are NO triggers in production** (verified via pg_trigger) and no
  sequence for it (only `settings_id_seq` exists). Production orders carry random 8-digit ids
  matching `generate_track_id()`'s output, so ids are produced by that function outside the
  schema (manually or by deployed code). `scripts/schema-complete.sql` adds
  `default public.generate_track_id()` so a fresh DB works standalone.
- `orders` and `order_items` SELECT policies are **public (`qual=true`)** — that's what powers
  the public `/track/{track_id}` page. **`settings` has RLS disabled** (anon can read AND
  write it). `discounts` has only a SELECT policy (active + date window); writes are
  service_role-only. `otps` has an `all everyone` policy. All reproduced faithfully in
  schema-complete.sql.
- All money columns are `numeric` (never float8): `numeric(10,2)` for phone_cases.price /
  orders.total_amount / order_items.product_price; plain `numeric` for settings.post_price,
  discounts.\*, orders.discount_amount; **text** for posters.price.
- The `handle_new_user` trigger inserts only `profiles(id)` — it does NOT copy the display
  name (that's why `profiles.display_name` is nullable; the UI reads display name from auth
  user_metadata instead).

**Order statuses** (used across dashboard, track page, order-progress, admin):
All status labels, badge classes, icons, and timeline steps are centralized in
`lib/types/order-status.ts`. Consumers import from there instead of maintaining
duplicate maps. Statuses: `pending`, `pending_card_verification`, `paid`,
`outofstock`, `processing`, `ready`, `delivered`, `returned`, `canceled`, `refunded`.

## Shipping Model

`lib/shipping.ts` — shipping cost is charged **per distinct product-type group**:

- poster → group `poster`
- phonecase → group `phonecase`

A cart containing both pays `post_price` twice (2 shipments, shown as «۲ مرسوله»). To add a new
product type, extend `SHIPPING_GROUP_BY_PRODUCT_TYPE` and `SHIPPING_GROUP_LABELS`.
`post_price` comes from the `settings` table; `free_shipping` from a discount code.

## Environment Variables

```env
# === New infrastructure (Phase 1+) ===
DATABASE_URL=                  # PostgreSQL connection string (required)
BETTER_AUTH_SECRET=            # 32+ char secret for session signing (required)
BETTER_AUTH_URL=http://localhost:3000  # Base URL for Better Auth (required)

# === S3-compatible storage (ArvanCloud / MinIO) ===
S3_ENDPOINT=                   # e.g. https://s3.ir-thr-at1.arvancloud.ir
S3_BUCKET=                     # bucket name (e.g. collectina-storage)
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=default
S3_PUBLIC_URL=                 # public CDN URL for serving images

# === Optional: Supabase Storage fallback (remove after S3 is confirmed) ===
NEXT_PUBLIC_SUPABASE_URL=      # only needed if S3 not configured yet
NEXT_PUBLIC_SUPABASE_ANON_KEY= # only needed if S3 not configured yet

# === Application ===
NEXT_PUBLIC_APP_URL=https://collectina.ir
NEXT_PUBLIC_ADMIN_PHONE_NUMBER=  # phone number (09…) whose user is the admin

# === Payment Gateway (Zibal) ===
ZIBAL_MERCHANT_ID=              # Required: Your Zibal merchant ID
ZIBAL_SANDBOX=true              # Optional: Use Zibal sandbox for testing
```

`.env` is gitignored; there is a local `.env` in the repo root (not committed).

## Conventions & Gotchas

- **All UI text is Persian**, RTL (`<html lang="fa" dir="rtl">`). Numbers are formatted with
  `new Intl.NumberFormat("fa-IR")` + «تومان» suffix. Amounts are in **Toman** in the UI/DB and
  converted to Rials (`* 10`) only in `/api/payment/request`.
- **`next.config.mjs` sets `typescript.ignoreBuildErrors: true`** — `npm run build` will NOT fail on
  TS errors. Run `npx tsc --noEmit` yourself after non-trivial changes.
- **Read-heavy data is cached in-process via `lib/cache.ts`** (module-level Map + TTL, no framework
  dependency): settings (60s), phone-case/poster catalogs (5 min), and product feed pages (60s).
  Public GET routes (`/api/products`, `/api/settings`) also send `Cache-Control: s-maxage=60,
  stale-while-revalidate=120` for CDN caching on Vercel. Admin mutation routes call
  `invalidateCache("settings" | "feed" | "catalog")` so changes appear immediately — remember to
  invalidate when adding a new admin route that mutates those tables.
- **Images are unoptimized** (`images.unoptimized: true`, `qualities: [40, 75]`); components pass
  `quality={40|75}` explicitly and use small intrinsic sizes.
- shadcn/ui components live in `components/ui/`; regenerate with `npx shadcn@latest add <name>`.
  `components.json` aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`.
- **Card style**: `components/ui/card.tsx` has a minimal base style (`rounded-2xl border border-border bg-card shadow-none`). All cards across the app use this. To override (e.g. track page cards that need `bg-white` or `shadow-sm`), pass className overrides. Intentionally different cards (e.g. product-purchase-dock, banner) use custom div styling.
- Server components use `getCurrentUser()` from `@/lib/auth-helpers` and repositories from
  `@/lib/repositories/`. Client components use `useSession()` from `@/lib/auth-client`.
  Interactive components POST to Route Handlers (not directly to the DB).
- **Cart badge refresh** is driven by a custom browser event: code dispatches
  `window.dispatchEvent(new Event("cart-updated"))` after cart mutations; `header.tsx` listens.
- localStorage keys in use: `backTo` (post-login redirect), `selectedBrand`, `selectedPhoneCaseId`,
  `customPhonecasePreviewImage` (custom upload preview).
- `useToast` is a project hook (`hooks/use-toast.ts`) wrapping sonner — use it, not raw sonner.
- Tailwind v4 syntax: CSS-first config, `@theme inline`, arbitrary utilities like `size-*`, and
  `!` suffix for important (e.g. `border-0!`, `bg-transparent!`).
- The custom upload flow (`features/custom/`) uploads images via `/api/upload` (which uses the
  `StorageProvider` abstraction — S3 or Supabase Storage) and creates a `products` row.
- Git commit style: conventional prefixes (`fix:`, `feat:`, `refactor:`, `style:`) + version tags.
  Files may use CRLF line endings — keep edits consistent per file.
- `dashboard/mockup?image_url=…&id=…&type=…` exports product mockup PNGs (admin tool, reachable from AdminBar on product pages).
- Be careful with the production DB: RLS mostly allows any authenticated user to insert/update
  products/phone_cases (admin checks are app-level, not DB-level).

# IMPORTANT NOTE

whenever you change anything in codebase make sure this file stays update with our latest structure and also make sure to keep schema.sql file updated too
