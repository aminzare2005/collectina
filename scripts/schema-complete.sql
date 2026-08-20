-- ============================================================================
-- collectina — Complete PostgreSQL Schema (Single File)
-- Run this on a fresh PostgreSQL database. Everything you need is here.
--
-- Usage:
--   psql $DATABASE_URL -f schema-complete.sql
--
-- Last updated: 2026-08-19
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Better Auth tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "user" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL DEFAULT '',
  "email"         TEXT,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image"         TEXT,
  "phoneNumber"         TEXT UNIQUE,
  "phoneNumberVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token"       TEXT NOT NULL UNIQUE,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
  "id"                  TEXT PRIMARY KEY,
  "userId"              TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "issuer"              TEXT NOT NULL DEFAULT 'local',
  "accountId"           TEXT NOT NULL,
  "providerId"          TEXT NOT NULL DEFAULT 'credential',
  "accessToken"         TEXT,
  "refreshToken"        TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope"               TEXT,
  "idToken"             TEXT,
  "password"            TEXT,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "account_issuer_accountId_key" UNIQUE ("issuer", "accountId")
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id"          TEXT PRIMARY KEY,
  "identifier"  TEXT NOT NULL,
  "value"       TEXT NOT NULL,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Better Auth indexes
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session" ("token");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed', 'free_shipping');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Business Tables
-- ---------------------------------------------------------------------------

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id            TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  display_name  TEXT,
  phone_number  TEXT,
  address       TEXT,
  city          TEXT,
  postal_code   TEXT,
  telegram      TEXT,
  beta_og       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  description TEXT,
  image_url   TEXT,
  designer    TEXT REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE SET NULL,
  feed        BOOLEAN NOT NULL DEFAULT TRUE,
  pin         BOOLEAN NOT NULL DEFAULT FALSE,
  type        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Phone Cases
CREATE TABLE IF NOT EXISTS public.phone_cases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand      TEXT NOT NULL,
  model      TEXT NOT NULL,
  price      NUMERIC(10, 2) NOT NULL,
  available  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT phone_cases_brand_model_key UNIQUE (brand, model)
);

-- Posters
CREATE TABLE IF NOT EXISTS public.posters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute  TEXT,
  price      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available  BOOLEAN NOT NULL
);

-- Discounts
CREATE TABLE IF NOT EXISTS public.discounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL,
  type                public.discount_type NOT NULL,
  value               NUMERIC,
  max_discount_amount NUMERIC,
  min_order_amount    NUMERIC,
  starts_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  usage_limit         INTEGER,
  usage_per_user      INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT discounts_code_key UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS discounts_code_idx ON public.discounts (code);

-- Settings (single row)
CREATE TABLE IF NOT EXISTS public.settings (
  id             BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  post_price     NUMERIC NOT NULL,
  top_banner     TEXT,
  show_phonecase BOOLEAN NOT NULL DEFAULT TRUE,
  show_poster    BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.settings (id, post_price, top_banner, show_phonecase, show_poster)
VALUES (1, 0, '', false, false)
ON CONFLICT (id) DO NOTHING;

-- Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  phone_case_id UUID REFERENCES public.phone_cases(id) ON DELETE CASCADE,
  poster_id     UUID REFERENCES public.posters(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT cart_items_user_product_phonecase_unique UNIQUE (user_id, product_id, phone_case_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  total_amount         NUMERIC(10, 2) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending',
  payment_reference    TEXT,
  shipping_address     TEXT NOT NULL,
  shipping_city        TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  phone_number         TEXT NOT NULL,
  telegram             TEXT,
  receiver_name        TEXT,
  track_id             INTEGER NOT NULL,
  track_post_id        TEXT,
  discount_id          UUID REFERENCES public.discounts(id),
  discount_amount      NUMERIC NOT NULL DEFAULT 0,
  free_shipping        BOOLEAN NOT NULL DEFAULT FALSE,
  note                 TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orders_track_id_key UNIQUE (track_id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id),
  product_name  TEXT NOT NULL,
  product_price NUMERIC(10, 2) NOT NULL,
  quantity      INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  phone_case_id UUID REFERENCES public.phone_cases(id),
  phone_brand   TEXT,
  phone_model   TEXT,
  poster_atr    TEXT,
  poster_id     UUID REFERENCES public.posters(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Discount Usages
CREATE TABLE IF NOT EXISTS public.discount_usages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE RESTRICT,
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  used_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_discount_usage UNIQUE (discount_id, user_id),
  CONSTRAINT discount_usages_discount_id_order_id_key UNIQUE (discount_id, order_id)
);

CREATE INDEX IF NOT EXISTS discount_usages_user_idx ON public.discount_usages (user_id);
CREATE INDEX IF NOT EXISTS discount_usages_discount_idx ON public.discount_usages (discount_id);

-- Discount Usage Stats (view)
CREATE OR REPLACE VIEW public.discount_usage_stats AS
  SELECT discount_id, COUNT(*)::BIGINT AS total_usage
  FROM public.discount_usages
  GROUP BY discount_id;

-- ---------------------------------------------------------------------------
-- 4. Functions
-- ---------------------------------------------------------------------------

-- Generate random 8-digit track ID
CREATE OR REPLACE FUNCTION public.generate_track_id()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_id INT4;
BEGIN
  LOOP
    new_id := FLOOR(RANDOM() * 90000000) + 10000000;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM orders WHERE track_id = new_id
    );
  END LOOP;
  RETURN new_id;
END;
$$;

-- Set default for track_id now that function exists
ALTER TABLE public.orders ALTER COLUMN track_id SET DEFAULT public.generate_track_id();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_better_auth_user_created ON "user";
CREATE TRIGGER on_better_auth_user_created
  AFTER INSERT ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS products_type_idx ON public.products (type);
CREATE INDEX IF NOT EXISTS products_feed_idx ON public.products (feed);
CREATE INDEX IF NOT EXISTS products_pin_idx ON public.products (pin);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at DESC);
-- Composite index for the product feed queries:
--   WHERE type = $1 AND feed = true ORDER BY pin DESC, created_at DESC
-- Without it Postgres does a seq scan + sort of the whole table on every
-- paginated grid request (see ProductRepository.getFeed / getPinned).
CREATE INDEX IF NOT EXISTS products_feed_query_idx
  ON public.products (type, feed, pin DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS cart_items_user_idx ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_track_id_idx ON public.orders (track_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Done. Run: psql $DATABASE_URL -f schema-complete.sql
-- Then set env vars and start the app.
-- ---------------------------------------------------------------------------
