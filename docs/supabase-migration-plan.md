# Removing Supabase — Audit & Migration Plan

- **Repo:** collectina (Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4)
- **Version at time of audit:** 2.6.0
- **Audit date:** 2026-08-18
- **Status:** Plan for review — **no code has been changed**

This document is the deliverable of the first step of the Supabase-removal task: a complete
inventory of Supabase coupling, a target architecture, technology recommendations, and a staged
migration plan. It does **not** modify any application code.

---

## A. Current Architecture

The storefront is a Next.js 16 App Router application with React Server Components. All UI text is
Persian/RTL. The store sells two product types (phone cases, posters) with per-variant pricing,
cart, discount codes, a Zibal payment flow (via an Iran-based PHP proxy), a public order-tracking
page, a user dashboard, and an admin panel.

**How data flows today — every layer talks to Supabase directly:**

```
Client components (use client)
   │  supabase.auth.* / supabase.from("...")   ← @supabase/ssr browser client (anon key + RLS)
   ▼
Server components / API routes
   │  supabase.auth.* / supabase.from("...")   ← @supabase/ssr server client (cookie session)
   ▼
proxy.ts (Next middleware) → lib/supabase/middleware.ts   ← session refresh + route guard
   ▼
Supabase (PostgREST over Postgres)  +  Supabase Auth  +  Supabase Storage (2 public buckets)
```

Key facts that shape the migration:

- **All data access goes through supabase-js.** There is no repository/service layer anywhere.
  ~30 files call `createClient()` and then `supabase.from(...)` or `supabase.auth.*`.
- **Business logic lives in client components.** The heaviest case is `components/checkout-form.tsx`,
  which fetches the cart (with nested joins), validates discount codes against `discounts` +
  `discount_usages` **in the browser**, inserts the `orders` row, inserts `order_items`, updates
  `profiles`, calls `/api/payment/request`, and stores the Zibal trackId — all from the client.
- **Auth is Supabase Auth, phone + password.** `0912…` is normalized to `+98912…` on login/signup.
  Sessions are `sb-*` cookies managed by `@supabase/ssr` and refreshed in middleware.
- **Admin is identified by phone** (`user.phone === NEXT_PUBLIC_ADMIN_PHONE_NUMBER`), checked in
  ~8 places (server components, client components, middleware-independent pages).
- **Storage is only used by the two admin "custom upload" flows.** Files go to public buckets
  `custom-phonecase` / `custom-poster`; the resulting absolute URL is stored in
  `products.image_url`.
- **Image delivery** is plain absolute Supabase Storage URLs rendered through `next/image` with
  `images.unoptimized: true`. No transformations, no signed URLs, no private buckets.
- **Payments** already go through an Iran-friendly path: Zibal (Iran) reached through a PHP proxy
  on a fixed-IP cPanel host (`fetchme.ir/collectina`).
- **Deployment** targets Vercel (`.vercel/`) and/or Liara (`liara.json`, Iran-based).

---

## B. Supabase Dependency Map

### B.1 Packages

| File | Dependency | Purpose |
|---|---|---|
| `package.json` | `@supabase/ssr`, `@supabase/supabase-js` | browser/server clients, session cookies |

### B.2 Client factories & middleware (the plumbing)

| File | What it does |
|---|---|
| `lib/supabase/client.ts` | `createBrowserClient(URL, ANON_KEY)` — browser client used by every client component. Anon key is public; security relies entirely on RLS. |
| `lib/supabase/server.ts` | `createServerClient` with `cookies()` store — server client for RSCs and API routes. |
| `lib/supabase/middleware.ts` | `updateSession()`: refreshes session cookies on every request and enforces route guard (logged-out → redirect from `/dashboard*`/`/checkout*`; logged-in → redirect away from `/auth/*`). |
| `proxy.ts` | Next 16 middleware wrapper around `updateSession` (matcher excludes static assets). |

### B.3 Auth touchpoints (`supabase.auth.*`)

| File | Calls |
|---|---|
| `app/(auth)/auth/login/page.tsx` | `signInWithPassword({phone, password})` + Supabase error → Persian mapping |
| `app/(auth)/auth/signup/page.tsx` | `signUp({phone, password, options.data.display_name})` + error mapping |
| `hooks/use-logout.ts`, `components/logout-button.tsx` | `signOut()` |
| `components/header.tsx` | `auth.getUser()` + cart item count |
| `components/phonecase-grid.tsx`, `poster-grid.tsx` | `auth.getUser()` to decide admin rendering |
| `components/phone-case-selector.tsx`, `poster-selector.tsx`, `features/custom/*` | `auth.getUser()` before cart insert |
| `components/checkout-form.tsx`, `components/profile-form.tsx` | `auth.getUser()` |
| `app/(site)/(dashboard)/layout.tsx`, `dashboard/page.tsx`, `dashboard/me/page.tsx`, `dashboard/admin/page.tsx`, `dashboard/admin/mng/page.tsx`, `components/admin-bar.tsx`, `app/(site)/(main)/phonecase/custom/page.tsx`, `poster/custom/page.tsx`, `app/(status)/order-success/page.tsx`, `order-failed/page.tsx`, `app/api/payment/verify/route.ts` | `auth.getUser()` (server) |

### B.4 Data access — server components & API routes (`supabase.from(...)`)

| File | Tables / purpose |
|---|---|
| `helpers/should-i-render.ts` | `settings` — store open/closed flags + top banner (drives home page) |
| `app/(site)/(main)/phonecase/[id]/page.tsx`, `poster/[id]/page.tsx` | `products` (by id + type), `phone_cases` / `posters` (variant list) |
| `app/(site)/(main)/phonecase/custom/page.tsx`, `poster/custom/page.tsx` | admin gate + variant list |
| `app/(site)/(dashboard)/dashboard/page.tsx` | `orders` by `user_id` |
| `app/(site)/(dashboard)/dashboard/me/page.tsx` | `profiles` by id |
| `app/(site)/(dashboard)/dashboard/admin/page.tsx` | all `orders` + nested `order_items` + `products` (for copy-to-clipboard payloads) |
| `app/(status)/order-success/page.tsx`, `order-failed/page.tsx` | `orders` by id + ownership check |
| `app/(status)/track/[track]/page.tsx` | `orders` by `track_id` (public!) + nested `order_items`/`products` |
| `app/api/payment/verify/route.ts` | update `orders.status='paid'`, delete `cart_items` for user |

### B.5 Data access — client components (`supabase.from(...)` in the browser)

| File | Tables / purpose |
|---|---|
| `app/(site)/(main)/cart/page.tsx` | `cart_items` (nested joins to products/phone_cases/posters), `profiles`, `settings` |
| `components/cart-item.tsx` | `cart_items` update quantity / delete |
| `components/cart-poster-suggestion.tsx` | `products` poster feed |
| `components/phonecase-grid.tsx`, `poster-grid.tsx` | `products` feed with `.range()` pagination, `pin`/`created_at` order |
| `components/phone-case-selector.tsx`, `poster-selector.tsx` | `cart_items` insert / increment |
| `components/checkout-form.tsx` | `discounts`, `discount_usages` (counts), `cart_items` (join), `orders` insert, `order_items` insert, `profiles` update, `orders` update (`payment_reference`) |
| `components/profile-form.tsx` | `profiles` update |
| `app/(site)/(dashboard)/dashboard/admin/mng/page.tsx` | admin gate |
| `app/(site)/(dashboard)/dashboard/admin/mng/products-manager.tsx` | `products` CRUD |
| `app/(site)/(dashboard)/dashboard/admin/mng/phone-cases-manager.tsx` | `phone_cases` CRUD |
| `app/(site)/(dashboard)/dashboard/admin/mng/posters-manager.tsx` | `posters` CRUD |
| `app/(site)/(dashboard)/dashboard/admin/mng/settings-manager.tsx` | `settings` read/update (public RLS!) |
| `features/custom/custom-phonecase-page-client.tsx`, `custom-poster-page-client.tsx` | `auth.getUser()`, upload trigger |
| `features/custom/custom-phonecase-selector.tsx` | storage upload + `products` insert + `cart_items` insert |
| `features/custom/custom-poster-selector.tsx` | storage upload (with retry) + `products` insert + `cart_items` insert |

### B.6 Storage (Supabase Storage)

| File | What it does |
|---|---|
| `features/custom/custom-phonecase-selector.tsx` (`uploadAndCreateProduct`) | `storage.from("custom-phonecase").upload(...)` → public URL → `products.insert` |
| `features/custom/custom-poster-selector.tsx` (`uploadAndCreateProductWithFile`) | `storage.from("custom-poster").upload(...)` + `getPublicUrl()` + cleanup on DB error; base64 compat wrapper |

Buckets: `custom-phonecase`, `custom-poster` (both **public**). URLs persisted in
`products.image_url` as `https://<project>.supabase.co/storage/v1/object/public/<path>`.

### B.7 Schema-level coupling (Supabase-specific Postgres features)

| Schema item (in `scripts/schema.sql`) | Supabase-specific? | Fate |
|---|---|---|
| `auth.users` FKs: `profiles.id`, `products.designer`, `cart_items.user_id`, `orders.user_id`, `discount_usages.user_id` | Yes — references the Supabase Auth schema | Replace with FK → our own user table |
| Trigger `on_auth_user_created` on `auth.users` → `handle_new_user()` | Yes | Drop; user row creation moves to app code |
| Functions `get_user_id_by_phone()`, `update_user_display_name()` (read/write `auth.users`) | Yes | Rewrite against our user table, or drop (dormant) |
| RLS policies using `auth.uid()` on all tables except `settings` | Yes — requires Supabase JWT | Replaced by application-layer authorization (see §G) |
| Grants to `anon`, `authenticated`, `service_role` | Yes — Supabase roles | Replace with one least-privilege app DB role |
| `gen_random_uuid()` | No — core Postgres 13+ | Keep |
| `discount_type` enum, `discount_usage_stats` view, `generate_track_id()` | No | Keep as-is |
| `posters.price` TEXT, `orders.track_id` int4 w/ default, money as `numeric` | No (quirks) | Keep as-is |
| `settings` RLS disabled | Yes (policy absence) | Fix: app-layer write restriction |
| `otps` table | No, but dormant | Keep or drop; never used by app |

### B.8 Environment variables

| Var | Role |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server + middleware clients; also used to build storage URLs |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server + middleware clients |
| `NEXT_PUBLIC_APP_URL` | payment callback URL (keep) |
| `ZIBAL_PROXY_URL`, `ZIBAL_PROXY_SECRET` | Zibal PHP proxy (keep) |
| `NEXT_PUBLIC_ADMIN_PHONE_NUMBER` | admin gating (keep) |

### B.9 Supabase features **not** used (no migration needed — explicitly checked)

- ❌ Realtime / channels / presence — none (`supabase.channel` never used)
- ❌ Edge Functions — none
- ❌ RPC (`supabase.rpc`) — none called from the app
- ❌ Webhooks / database webhooks — none
- ❌ Cron / scheduled jobs — none
- ❌ Supabase-generated TypeScript types — `lib/types/database.ts` is **hand-written** (and already
  out of sync with `schema.sql`: `Product` lacks `feed`/`pin`, `Poster.price` typed `number` but is
  TEXT, `Discount` has a non-existent `updated_at`, `OrderStatus` lacks several statuses,
  `Settings`/`Profile`/`CartItem` are missing columns). It must be rewritten during migration.
- ❌ PostGIS / custom extensions — only `pgcrypto`-style defaults; nothing Supabase-specific beyond auth/storage schemas.

---

## C. Target Architecture

```
UI (React Server Components / Client Components)
   │  (no @supabase imports anywhere)
   ▼
Services  (auth, cart, checkout, product, order, discount, settings, storage)
   │
   ▼
Repositories  (ProductRepository, CartRepository, OrderRepository, UserRepository,
                DiscountRepository, SettingsRepository, VariantRepository)
   │
   ▼
DB adapter (postgres.js)  ──►  Self-hosted PostgreSQL
StorageProvider interface ──►  S3-compatible storage (MinIO / ArvanCloud) + CDN
AuthService (bcrypt + signed session cookie)  ──►  users live in our own DB
```

Boundaries:

- **UI ↔ app logic:** Client components never touch the database or SDKs. They call Next.js Route
  Handlers (and occasionally Server Actions) that sit in the service layer. Server components call
  services/repositories directly (no HTTP hop).
- **App logic ↔ infrastructure:** Services depend on repository *interfaces* and a
  `StorageProvider` interface, never on a concrete provider. Swapping PostgreSQL for something else,
  or MinIO for another object store, means changing one adapter, not business code.
- **Auth:** a small `AuthService` issues a signed, httpOnly session cookie (JWT via `jose`).
  `getCurrentUser()` is available to server code; a `GET /api/auth/session` endpoint feeds client
  components. `proxy.ts` verifies the cookie signature locally — **no network call per request**.
- **Storage:** `StorageProvider` interface with `upload / getUrl / remove`. Default implementation
  is S3-compatible (works against MinIO and ArvanCloud Objects); a Supabase-backed implementation
  is kept only during the transition and deleted at the end.
- **Image delivery:** stays URL-based. `products.image_url` stores the absolute public URL returned
  by the storage provider/CDN. `next/image` stays `unoptimized`. Changing CDN = changing the
  storage base URL/CNAME, no component changes.

---

## D. Technology Recommendations

### D.1 PostgreSQL
**Self-hosted PostgreSQL 15/16** (or an Iran-hosted managed Postgres, e.g. ArvanCloud DBaaS) on the
same Iranian VPS/Liara app server or a sibling VM. The schema is small (11 tables) and stable; a
single node with daily `pg_dump` backups is sufficient. No extension beyond core is required.

### D.2 Database access
**`postgres.js`** (`postgres` npm package) — a mature, actively maintained, zero-codegen Postgres
client for Node/Edge, with TypeScript row generics (`sql<Row[]>`).

Why not Prisma/Drizzle: `scripts/schema.sql` is the project's declared **single source of truth**
(AGENTS.md). An ORM would introduce a second schema definition that must be kept in sync, plus
codegen — pure overhead for ~30 query shapes. postgres.js keeps queries as SQL (close to the
schema) and rows strictly typed.

Repositories are plain TypeScript modules returning typed domain types (rewriting
`lib/types/database.ts` to match `schema.sql` exactly). **No `any` anywhere.**

### D.3 Migrations
Keep `scripts/schema.sql` as the canonical base, and add `scripts/migrations/` with numbered SQL
files (`001_*.sql`, …) for subsequent changes, applied with `psql` or a ~30-line runner script.
`node-pg-migrate` is a fine alternative if we want a tool, but adds a dependency for marginal
benefit at this scale.

### D.4 Authentication
**Recommended: small custom auth layer** — `bcryptjs` (verify/`$2a$` hashes) + `jose` (signed JWT
session cookie) + the existing `profiles` table extended with `password_hash` and a unique
`phone_number`.

Evaluation against the task's criteria:

| Criterion | Custom (recommended) | Better Auth | Auth.js v5 |
|---|---|---|---|
| App Router / TS / RSC | ✓ | ✓ | ✓ |
| Phone + password | ✓ (native) | needs custom fields/plugins | needs custom provider |
| Existing bcrypt hashes (`$2a$10$`, Supabase) | ✓ verify with bcryptjs, zero resets | ✗ default scrypt → custom hasher or forced reset | ✓ we implement `authorize`, verify bcrypt |
| Session check in middleware w/o network | ✓ local JWT verify | needs adapter call | JWT mode ok |
| OAuth / email / reset / MFA | not needed by app | available | available |
| Schema impact | +2 columns on existing table | new `user/session/account/…` tables + mapping | optional |
| Code volume | ~200 lines, fully understood | framework + plugins | framework + adapter |
| Maturity | n/a (small custom code) | young but active | mature, historically churny |

Deciding factors: the app's entire auth surface is **login, signup, logout, and "who am I"** — no
OAuth, no email verification, no password reset, no roles table (admin = phone match). Existing
users must not be forced to reset passwords, and the migration must not add network round-trips to
foreign infrastructure. A ~200-line auth module satisfies all of that with two tiny, boring
dependencies and no framework lock-in. **Better Auth is the recommended fallback** if we prefer a
maintained framework; it will cost a users/sessions schema and either a custom hasher or a
one-time password reset for existing accounts.

Session shape: keep it compatible with current UI — `{ id, phone, user_metadata: { display_name } }`
— so the ~15 `getUser()` call sites change minimally.

### D.5 Object storage
**S3-compatible storage via `@aws-sdk/client-s3`** behind the `StorageProvider` interface, with an
endpoint-configurable client so it runs against **MinIO** (self-hosted in Iran) or **ArvanCloud
Objects** (Iranian managed S3) without code changes. The custom-upload flow becomes: browser →
our API route → `StorageProvider.upload(...)` (keys stay server-side).

### D.6 CDN / image delivery
Keep URLs absolute in `products.image_url` and `next/image` **unoptimized** (as today — no
behavior change). Serve images through an Iranian CDN (e.g. ArvanCloud CDN in front of ArvanCloud
Objects, or nginx on the VPS serving a `/uploads` path) so the CDN layer can be swapped
independently of the storage provider. Deployment detail: the mockup exporter (`html-to-image`) and
`next/image` need the image origin to send `Access-Control-Allow-Origin` / be reachable from the
browser — MinIO/nginx CORS headers must be configured.

### D.7 Backups
Daily `pg_dump -Fc` to a second disk/host + verify restore monthly; document restore procedure in
`docs/`. Storage objects backed up with an S3 sync to a second location. (Same discipline as
today's Supabase-managed backups, but owned by us.)

---

## E. Migration Plan (staged, each phase independently testable)

Every phase: files affected → architectural change → strategy → risk → validation → rollback.
Rollback rule throughout: **the production Supabase DB and buckets are never modified or deleted
until the final phase**, and every code phase is a normal git revert.

### Phase 0 — Safety baseline (ops, no code)
- **Files:** none
- **Change:** pg_dump the production Supabase DB (`-Fc`), verify the dump restores into a scratch
  DB, snapshot the two storage buckets (download all objects), and copy the dump off-site. Freeze
  schema changes.
- **Risk:** low (read-only).
- **Validation:** `pg_restore --list` succeeds; object counts match.
- **Rollback:** n/a.

### Phase 1 — New infrastructure + abstraction skeleton (additive, zero behavior change)
- **Files (new):** `lib/db/pool.ts` (postgres.js pool), `lib/db/types.ts` (rewritten from
  schema.sql), `lib/repositories/*.ts` (Product, Variant, Cart, Order, User, Discount, Settings —
  SQL-only, typed), `lib/services/auth.ts`, `lib/storage/types.ts` + `S3StorageProvider` +
  `SupabaseStorageProvider` (transitional), `scripts/migrations/`.
- **Change:** spin up self-hosted Postgres, apply `schema.sql` (+ user-table changes from §F),
  apply the auth/session design. All new code; existing app untouched.
- **Risk:** low (additive).
- **Validation:** `npx tsc --noEmit`; repository unit smoke tests against the new DB with copied
  data.
- **Rollback:** delete new code; app still runs on Supabase.

### Phase 2 — Data migration (see §F for exact steps)
- **Files:** scripts under `scripts/` (data copy, user transform, storage copy, URL rewrite).
- **Change:** copy all 11 tables; merge `auth.users` → `profiles` (+`password_hash`, unique
  `phone`); re-point FKs; copy storage objects; rewrite `products.image_url` (or keep old URLs
  during dual-run).
- **Risk:** medium — data integrity. Mitigated by Phase 0 backup + row-count verification.
- **Validation:** row counts per table; spot-check orders/cart_items FKs; login smoke test with a
  real user's bcrypt hash.
- **Rollback:** Supabase untouched; point app back at old env vars.

### Phase 3 — Server-side reads → repositories
- **Files:** `helpers/should-i-render.ts`, product detail pages, `track/[track]`, `order-success`,
  `order-failed`, dashboard pages, admin page, `admin-bar.tsx`, `api/payment/verify`.
- **Change:** server components call repositories + `getCurrentUser()` instead of supabase-js.
  The public track page switches from a public SELECT to a repository method returning **only**
  tracking fields (fixes the "all orders public" hole).
- **Risk:** medium (many files, mostly mechanical).
- **Validation:** typecheck + build + manual pass through every page against the new DB.
- **Rollback:** git revert per file.

### Phase 4 — Authentication replacement
- **Files:** `app/(auth)/auth/login`, `signup`, `hooks/use-logout.ts`, `logout-button.tsx`,
  `proxy.ts` + `lib/supabase/middleware.ts` → new `lib/auth/` middleware, `lib/services/auth.ts`,
  `GET /api/auth/session`, `components/header.tsx` (user + cart count via API), grid admin checks,
  `components/admin-bar.tsx`, dashboard layout, admin gates, custom-page gates.
- **Change:** login/signup/logout become server-side handlers using bcrypt verification + signed
  session cookie; `proxy.ts` verifies the cookie locally and keeps the exact same route-guard
  behavior; admin checks move to a shared `isAdmin(user)` helper.
- **Risk:** medium — this is the one place users notice change (single re-login after cutover).
- **Validation:** login with migrated account (bcrypt), signup (new bcrypt hash), logout, protected
  routes, admin gates, cart badge.
- **Rollback:** keep old login page behind env flag; revert commits.

### Phase 5 — Client-side data → Route Handlers (largest phase)
- **Files:** `cart/page.tsx`, `cart-item.tsx`, `cart-poster-suggestion.tsx`, grids, selectors,
  `checkout-form.tsx`, `profile-form.tsx`, admin mng managers, plus new
  `app/api/cart|products|checkout|profile|admin/*` handlers.
- **Change:** every client `supabase.from()` becomes a fetch to a Route Handler backed by a
  repository. **Checkout moves server-side:** order creation, amount computation, and discount
  validation happen in the service layer (closing the client-trusted-total and client-side-discount
  holes); the client just POSTs the form and gets a payment start URL.
- **Risk:** high (biggest blast radius; touches the money path).
- **Validation:** full checkout walkthrough with a discount code and a Zibal sandbox payment;
  cart CRUD; infinite-scroll grids; admin CRUD; custom upload.
- **Rollback:** feature-flag `NEXT_PUBLIC_USE_LEGACY=1` to fall back to the Supabase client during
  the transition window.

### Phase 6 — Storage cutover
- **Files:** `features/custom/*` (4 files) + new upload API route.
- **Change:** uploads go through `StorageProvider` (S3-compatible); image URLs resolve to the new
  storage/CDN base; SupabaseStorageProvider deleted.
- **Risk:** medium (assets + CORS).
- **Validation:** custom phonecase + poster upload end-to-end; mockup export still renders; old
  product images still load (URLs rewritten or dual-served).
- **Rollback:** keep SupabaseStorageProvider until Phase 7.

### Phase 7 — Remove Supabase entirely
- **Files:** delete `lib/supabase/`; remove `@supabase/*` deps; remove
  `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`; purge leftover `any` types; rewrite
  `lib/types/database.ts`; update `AGENTS.md`, `docs/zibal-proxy-setup.md`, env docs.
- **Change:** no Supabase code, env, or dependency remains; grep for `supabase` returns only docs
  history.
- **Risk:** low (removal after everything above is green).
- **Validation:** `npx tsc --noEmit`, `npm run build`, full manual regression, grep audit.
- **Rollback:** git history; Supabase infra still exists untouched.

### Phase 8 — Iran deployment + hardening
- **Files:** `liara.json` (or new VPS config), `app/layout.tsx` (font + analytics decision),
  `next.config.mjs` (fonts self-hosting), docs (runbooks, backup/restore).
- **Change:** deploy to Iranian hosting; DNS + SSL; scheduled backups; uptime/error monitoring;
  vendor the Rubik font (removes build-time Google Fonts dependency); decide fate of Vercel
  Analytics (drop or replace with an Iran-reachable analytics). Only after a monitoring window
  (≥1 week) and a verified rollback drill: decommission Supabase DB/storage.
- **Risk:** medium (production cutover).
- **Validation:** storefront E2E from Iran; payment flow; backup restore drill; outage drill
  (kill international egress except Zibal, confirm store still functions).
- **Rollback:** DNS flip + env pointer back to Supabase during the monitoring window.

---

## F. Data Migration

### F.1 Database
1. **Dump:** from Supabase via its direct Postgres connection (`pg_dump -Fc` — read-only).
2. **Restore:** into the new self-hosted Postgres. `scripts/schema.sql` (with the §F.2 user-table
   changes) is the target DDL; restore data via `pg_restore`/`COPY` per table.
3. **Transform (users):**
   - Add to `profiles`: `password_hash text`, make `phone_number text UNIQUE NOT NULL`, keep all
     existing profile columns. `profiles.id` keeps its UUID so every FK/row reference stays valid.
   - Copy from `auth.users`: `id`, `phone` → `profiles.phone_number`,
     `encrypted_password` → `profiles.password_hash` (Supabase stores bcrypt `$2a$10$…`, verifiable
     with bcryptjs), `raw_app_meta_data->>'display_name'` → `profiles.display_name`, `created_at`.
   - Drop the `auth.users` FKs and the `handle_new_user` trigger; the app creates users directly.
   - **Result: existing accounts log in with their current password. No recreation, no reset.**
     Session migration: the old `sb-*` cookie is a Supabase-signed JWT we cannot verify — each user
     logs in **once** after cutover. Acceptable; communicated via a banner on the login page.
4. **Quirks preserved:** `posters.price` TEXT, `orders.track_id` default `generate_track_id()`
   (schema.sql already adds this), money as `numeric`, `discount_type` enum, `discount_usage_stats`
   view, `discounts`/`orders` indexes, `unique(brand, model)` etc.
5. **Verification:** row-count parity per table, FK spot checks, bcrypt login smoke test, a few
   order→items→products joins, `track_id` uniqueness.

### F.2 Storage objects
1. List + download every object from `custom-phonecase` and `custom-poster` (Supabase Storage API).
2. Upload to the new S3-compatible storage under the same keys.
3. **URL strategy (staged):** during dual-run, leave `products.image_url` pointing at Supabase
   URLs (they still work); after cutover, run a one-time SQL update rewriting the host portion of
   `image_url` to the new storage/CDN base (pure string replace, same path). No re-upload needed.

---

## G. Security

RLS is Supabase-specific (policies call `auth.uid()`, a function over the Supabase JWT). After
migration the app talks to Postgres through **one least-privilege app role** (no superuser), so
**authorization moves to the application layer** — repository methods always scope rows to the
session user, and the service layer enforces admin checks. This is explicit, not accidental.

| Former RLS policy | Old guarantee | New guard (app layer) |
|---|---|---|
| `profiles` own (select/insert/update/delete) | user only touches own profile | `UserRepository` always filters `id = session.user.id`; server-side |
| `products` select all | public read | public `ProductRepository` reads (feed/pagination) |
| `products` insert/update/delete authenticated | **any logged-in user could write** (weak) | admin-only repository writes via `isAdmin(user)` |
| `phone_cases` / `posters` select all | public read | public reads |
| `phone_cases` / `posters` write authenticated | **weak** | admin-only |
| `cart_items` own | own cart only | `CartRepository` scoped to session user |
| `orders` select **public** | **anyone reads ALL orders** (hole) | public `getOrderByTrackId()` returns only tracking fields; user's orders via `OrderRepository(user_id)` |
| `orders` insert own | own orders | `OrderService` inserts with `user_id` from session |
| `orders` update own | owner updates | payment verify updates only after Zibal verification + ownership check; admin status changes admin-only |
| `order_items` select public (×2) | **hole** | never selected directly; joined through order visibility rules |
| `order_items` insert (subquery) | own order items | inserted in the same transaction as the order |
| `discounts` select active | codes readable by anyone (needed for client-side validation) | **server-side validation only** — codes never shipped to the client |
| `discount_usages` select own | own usage | checked server-side by `DiscountService` |
| `settings` (RLS disabled) | **anon read AND write** (hole) | public read of needed fields; admin-only writes |
| `otps` "all everyone" | **full public access** (dormant) | dropped from the new schema |

Additional hardening folded into the migration (not scope creep — they close holes RLS was masking):

- **Checkout amounts re-validated server-side** (today `total_amount` and the payment amount are
  client-supplied; a modified client could underpay).
- **Discount codes validated + usage recorded server-side** (today a client can read every code and
  forge discounts).
- Session cookie: `httpOnly`, `Secure`, `SameSite=Lax`; signed JWT (HMAC, `SESSION_SECRET`).
- Basic login rate limiting (e.g. per-phone/IP) since auth is now self-hosted.
- `NEXT_PUBLIC_ADMIN_PHONE_NUMBER` remains the admin authority (documented; optionally move to a
  server-only `ADMIN_PHONE_NUMBER` so it is not public).

---

## H. Remaining External Dependencies (after Supabase is gone)

| Dependency | Location | Iran-only? | Notes |
|---|---|---|---|
| Zibal gateway + PHP proxy (`fetchme.ir/collectina`) | `lib/zibal-proxy.ts`, `server/payment-proxy/`, `app/api/payment/*` | ✅ Iran | required for payments; already fixed-IP Iranian host |
| `gateway.zibal.ir`, `tracking.post.ir` | payment start, track page | ✅ Iran | required |
| Telegram (`t.me/collectina`) | homepage CTA, support | ✅ reachable in Iran | user-facing; not load-bearing |
| Vercel Analytics (`@vercel/analytics`) | `app/layout.tsx` | ❌ international CDN | non-blocking script; replace or remove in Phase 8 |
| `next/font/google` (Rubik) | `app/layout.tsx` | ❌ build-time | downloads at **build** only; vendor the font file in Phase 8 to remove |
| npm registry | CI/build | ❌ | build-time only; can mirror via ArvanCloud npm if needed |
| Next.js/Vercel hosting | `liara.json` / `.vercel/` | ⚠️ Vercel is international | deploy to Liara (Iran) in Phase 8 to eliminate |
| DNS + SSL | infra | depends on provider | use an Iranian registrar / cert issuance reachable from Iran |

**Conclusion:** after Phase 8 the only runtime international dependency left is Zibal-adjacent
(none — Zibal is Iranian) and the optional analytics script. The store can operate with
international internet severely disrupted.

---

## I. Estimated Complexity

| Area | Complexity | Why |
|---|---|---|
| Repository layer + postgres.js adapter | **Medium** | ~11 tables, ~30 query shapes; mechanical but must be typed strictly (no `any`) |
| Server components → repositories | **Medium** | many files, mostly read-only; the public track page needs a scoped query |
| Auth replacement | **Medium** | small surface, but security-critical (hashes, sessions, middleware, admin) |
| Client components → Route Handlers | **High** | largest blast radius; checkout is the money path and moves server-side |
| Storage abstraction + object migration | **Medium** | two upload flows + object copy + URL rewrite + CORS |
| Data migration | **Medium** | dump/restore + user transform + verification; safe because Supabase stays untouched |
| Iran deployment & hardening | **Medium** | hosting move, DNS/SSL, backups, monitoring, font/analytics |
| Removal & cleanup | **Low** | deletion + type rewrite + docs |

---

## J. Recommended Execution Order

Run in this order; each phase ends green before the next starts:

1. **Phase 0** — backups & verification (no code).
2. **Phase 1** — new Postgres + abstraction skeleton (additive code).
3. **Phase 2** — data migration & verification.
4. **Phase 3** — server-side reads → repositories.
5. **Phase 4** — authentication replacement.
6. **Phase 5** — client-side data → Route Handlers (checkout last, after everything else is green).
7. **Phase 6** — storage cutover.
8. **Phase 7** — remove Supabase code/deps/env.
9. **Phase 8** — Iran deployment, hardening, monitoring, then decommission Supabase.

The production Supabase database and buckets remain untouched until the end of Phase 8.
