-- ============================================================================
-- collectina — DATABASE SCHEMA (single source of truth)
-- ============================================================================
-- Run this file anywhere (Supabase SQL editor, psql, supabase db push, a fresh
-- project) to recreate the entire database: tables, constraints, RLS policies,
-- functions, and the required settings row.
--
-- Verified 2026-08-18 against production via:
--   * service_role key → PostgREST OpenAPI spec (columns, types, NOT NULL,
--     simple defaults)
--   * SQL editor output of pg_policies, pg_get_constraintdef, pg_get_functiondef,
--     pg_indexes (RLS policies, constraints/FKs, function bodies, indexes)
--
-- Faithful to production, including its quirks:
--   * posters.price is TEXT ("50000"), orders/order_items are publicly readable
--     (that powers the public /track/{id} page), settings has NO RLS,
--     discounts has no write policies (service_role only)
-- ⚠️ See SECURITY NOTES at the bottom before applying to a fresh project.
-- ============================================================================


-- ============================================================================
-- Enum (✅ verified)
-- ============================================================================
create type public.discount_type as enum ('percentage', 'fixed', 'free_shipping');


-- ============================================================================
-- 1) profiles
--    ✅ verified: display_name NULLABLE, beta_og default false,
--    FK id → auth.users ON DELETE CASCADE
-- ============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,                        -- nullable ✅ (trigger doesn't set it)
  phone_number  text,
  address       text,
  city          text,
  postal_code   text,
  telegram      text,
  beta_og       boolean not null default false,  -- ✅ verified
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);


-- ============================================================================
-- 2) products
--    ✅ verified: name/type/image_url/designer NULLABLE, feed default true,
--    pin default false, FK designer → auth.users ON UPDATE CASCADE ON DELETE
--    SET NULL (constraint products_designer_fkey)
-- ============================================================================
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text,                          -- nullable ✅ (app always sets it)
  description text,
  image_url   text,
  designer    uuid references auth.users(id) on update cascade on delete set null,  -- ✅ verified FK
  feed        boolean not null default true,   -- ✅ verified default true
  pin         boolean not null default false,  -- ✅ verified default false
  type        text,                          -- nullable ✅; values: 'phonecase' | 'poster'
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.products enable row level security;

create policy "products_select_all" on public.products
  for select using (true);
-- ⚠️ any authenticated user can write — matches production (admin check is app-level)
create policy "products_insert_authenticated" on public.products
  for insert with check (auth.uid() is not null);
create policy "products_update_authenticated" on public.products
  for update using (auth.uid() is not null);
create policy "products_delete_authenticated" on public.products
  for delete using (auth.uid() is not null);


-- ============================================================================
-- 3) phone_cases
--    ✅ verified: price numeric(10,2), available NOT NULL default false,
--    unique(brand, model), all policies
-- ============================================================================
create table if not exists public.phone_cases (
  id         uuid primary key default gen_random_uuid(),
  brand      text not null,
  model      text not null,
  price      numeric(10, 2) not null,        -- ✅ verified
  available  boolean not null default false, -- ✅ verified default false
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint phone_cases_brand_model_key unique (brand, model)  -- ✅ verified
);

alter table public.phone_cases enable row level security;

create policy "phone_cases_select_all" on public.phone_cases
  for select using (true);
create policy "phone_cases_insert_authenticated" on public.phone_cases
  for insert with check (auth.uid() is not null);
create policy "phone_cases_update_authenticated" on public.phone_cases
  for update using (auth.uid() is not null);
create policy "phone_cases_delete_authenticated" on public.phone_cases
  for delete using (auth.uid() is not null);


-- ============================================================================
-- 4) posters
--    ✅ verified: price is TEXT, attribute NULLABLE, available NOT NULL (no
--    default), created_at NOT NULL default now(), no updated_at, no FKs.
--    Policy names kept as-is from production ("mfs could select from posters").
-- ============================================================================
create table if not exists public.posters (
  id         uuid primary key default gen_random_uuid(),
  attribute  text,                           -- nullable ✅
  price      text,                           -- ✅ TEXT — stores "50000" (quirk, verified)
  created_at timestamptz not null default now(),  -- ✅ NOT NULL
  available  boolean not null                -- ✅ NOT NULL, no default
);

alter table public.posters enable row level security;

create policy "mfs could select from posters" on public.posters
  for select using (true);
create policy "all insert poster" on public.posters
  for insert with check (auth.uid() is not null);
create policy "all update posters" on public.posters
  for update using (auth.uid() is not null);
create policy "all delete posters" on public.posters
  for delete using (auth.uid() is not null);


-- ============================================================================
-- 5) discounts
--    ✅ verified: type enum, plain numeric money, int4 limits, unique(code),
--    and the single SELECT policy (active + date window). No write policies —
--    only service_role can write discounts.
-- ============================================================================
create table if not exists public.discounts (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null,
  type                public.discount_type not null,  -- ✅ verified enum
  value               numeric,             -- ✅ verified plain numeric
  max_discount_amount numeric,
  min_order_amount    numeric,
  starts_at           timestamptz,
  expires_at          timestamptz,
  usage_limit         integer,             -- ✅ verified int4
  usage_per_user      integer,             -- ✅ verified int4
  is_active           boolean not null default true,  -- ✅ verified
  created_at          timestamptz default now(),
  constraint discounts_code_key unique (code)  -- ✅ verified
);

-- ✅ verified: production also has a redundant non-unique index on code
create index if not exists discounts_code_idx on public.discounts (code);

alter table public.discounts enable row level security;

create policy "Users can read active discounts" on public.discounts
  for select using (
    (is_active = true)
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at >= now())
  );


-- ============================================================================
-- 6) settings — single-row app config (admin → تنظیمات)
--    ✅ verified: 5 columns, no timestamps, id bigint identity, post_price
--    plain numeric, top_banner NULLABLE.
--    ⚠️ RLS is DISABLED on settings in production (no policies exist) — anyone
--    (including anon) can read AND write it. Reproduced faithfully below.
-- ============================================================================
create table if not exists public.settings (
  id             bigint primary key generated by default as identity,  -- ✅ verified int8
  post_price     numeric not null,           -- ✅ verified plain numeric (Toman, per shipment)
  top_banner     text,                       -- nullable ✅
  show_phonecase boolean not null default true,  -- ✅ verified
  show_poster    boolean not null default true   -- ✅ verified
);

-- NOTE: no `alter table ... enable row level security` — matches production.
-- See SECURITY NOTES at the bottom.

-- Required row: without it the storefront treats the store as closed.
insert into public.settings (id, post_price, top_banner, show_phonecase, show_poster)
values (1, 0, '', false, false)
on conflict (id) do nothing;


-- ============================================================================
-- 7) cart_items
--    ✅ verified: quantity default 1; FKs user_id/product_id/phone_case_id
--    ON DELETE CASCADE; poster_id ON UPDATE CASCADE ON DELETE SET NULL;
--    unique(user_id, product_id, phone_case_id)
-- ============================================================================
create table if not exists public.cart_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  quantity      integer not null default 1,   -- ✅ verified
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  phone_case_id uuid references public.phone_cases(id) on delete cascade,  -- ✅ verified FK
  poster_id     uuid references public.posters(id) on update cascade on delete set null,  -- ✅ verified FK
  constraint cart_items_user_product_phonecase_unique unique (user_id, product_id, phone_case_id)  -- ✅ verified
);

alter table public.cart_items enable row level security;

create policy "cart_items_select_own" on public.cart_items
  for select using (auth.uid() = user_id);
create policy "cart_items_insert_own" on public.cart_items
  for insert with check (auth.uid() = user_id);
create policy "cart_items_update_own" on public.cart_items
  for update using (auth.uid() = user_id);
create policy "cart_items_delete_own" on public.cart_items
  for delete using (auth.uid() = user_id);


-- ============================================================================
-- 8) orders
--    ✅ verified: total_amount numeric(10,2), status text default 'pending',
--    receiver_name NULLABLE, discount_amount numeric default 0, unique(track_id),
--    FKs user_id (CASCADE) + discount_id.
--    ⚠️ SELECT policy is PUBLIC (qual=true) in production — this powers the
--    public /track/{track_id} page. Reproduced faithfully; see SECURITY NOTES.
-- ============================================================================
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,  -- ✅ verified FK
  total_amount         numeric(10, 2) not null,  -- ✅ verified
  status               text not null default 'pending',  -- ✅ verified (text, not enum)
  payment_reference    text,                  -- Zibal trackId (written by checkout)
  shipping_address     text not null,
  shipping_city        text not null,
  shipping_postal_code text not null,
  phone_number         text not null,
  telegram             text,
  receiver_name        text,                  -- nullable ✅
  track_id             integer not null default public.generate_track_id(),  -- ✅ verified int4 NOT NULL + UNIQUE
  -- NOTE on the default: production has NO column default, NO trigger, and no
  -- sequence for track_id (verified via OpenAPI, pg_trigger, pg_sequences), and
  -- this repo's checkout never writes it — yet every production order carries a
  -- random 8-digit id matching generate_track_id()'s range. So ids are set with
  -- that function (manually via the SQL editor, or by deployed app code). This
  -- default makes the schema self-sufficient; it only applies when track_id is
  -- omitted, so it is harmless if something else supplies the value.
  track_post_id        text,                  -- Iran Post code, set by admin
  discount_id          uuid references public.discounts(id),  -- ✅ verified FK
  discount_amount      numeric not null default 0,  -- ✅ verified plain numeric
  free_shipping        boolean not null default false,
  note                 text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  constraint orders_track_id_key unique (track_id)  -- ✅ verified
);

alter table public.orders enable row level security;

create policy "orders_select_own" on public.orders
  for select using (true);                    -- ⚠️ public read — matches production
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_update_own" on public.orders
  for update using (auth.uid() = user_id);


-- ============================================================================
-- 9) order_items
--    ✅ verified: product_price numeric(10,2), quantity int4, FKs (poster_id
--    ON UPDATE CASCADE ON DELETE SET NULL; product_id/phone_case_id no action),
--    and TWO public SELECT policies in production (all view order items /
--    order_items_select_own both qual=true).
-- ============================================================================
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,  -- ✅ verified FK
  product_id    uuid not null references public.products(id),                  -- ✅ verified FK
  product_name  text not null,
  product_price numeric(10, 2) not null,   -- ✅ verified
  quantity      integer not null,          -- ✅ verified int4
  created_at    timestamptz default now(),
  phone_case_id uuid references public.phone_cases(id),  -- ✅ verified FK (no cascade)
  phone_brand   text,
  phone_model   text,
  poster_atr    text,                      -- poster attribute snapshot
  poster_id     uuid references public.posters(id) on update cascade on delete set null  -- ✅ verified FK
);

alter table public.order_items enable row level security;

-- ⚠️ both public — matches production
create policy "all view order items" on public.order_items
  for select using (true);
create policy "order_items_select_own" on public.order_items
  for select using (true);
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders
            where orders.id = order_items.order_id
              and orders.user_id = auth.uid())
  );


-- ============================================================================
-- 10) discount_usages
--     ✅ verified: columns id/discount_id/user_id/order_id/used_at; FKs
--     (discount_id ON DELETE RESTRICT, order_id + user_id CASCADE); two unique
--     keys (discount_id,user_id) and (discount_id,order_id); two plain indexes.
--     Policies: SELECT own for users, INSERT for service_role only.
-- ============================================================================
create table if not exists public.discount_usages (
  id          uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts(id) on delete restrict,  -- ✅ verified FK (RESTRICT!)
  user_id     uuid not null references auth.users(id) on delete cascade,         -- ✅ verified FK
  order_id    uuid not null references public.orders(id) on delete cascade,      -- ✅ verified FK
  used_at     timestamptz default now(),  -- ✅ verified (no created_at!)
  constraint unique_user_discount_usage unique (discount_id, user_id),               -- ✅ verified
  constraint discount_usages_discount_id_order_id_key unique (discount_id, order_id) -- ✅ verified
);

-- ✅ verified indexes
create index if not exists discount_usages_user_idx on public.discount_usages (user_id);
create index if not exists discount_usages_discount_idx on public.discount_usages (discount_id);

alter table public.discount_usages enable row level security;

create policy "Users can read their own discount usages" on public.discount_usages
  for select using (auth.uid() = user_id);
create policy "Service role can insert discount usages" on public.discount_usages
  for insert with check (true)
  to service_role;


-- ============================================================================
-- 11) discount_usage_stats — VIEW
--     ✅ verified columns (discount_id uuid, total_usage bigint);
--     body reconstructed from shape.
-- ============================================================================
create or replace view public.discount_usage_stats as
  select discount_id, count(*)::bigint as total_usage
  from public.discount_usages
  group by discount_id;


-- ============================================================================
-- 12) otps — one-time-password table (dormant: current auth is phone+password)
--     ✅ verified: unique(phone); single policy "all everyone" (ALL, public).
-- ============================================================================
create table if not exists public.otps (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  code       text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),  -- ✅ verified default
  expires_at timestamptz not null,
  constraint otps_phone_key unique (phone)  -- ✅ verified
);

alter table public.otps enable row level security;

create policy "all everyone" on public.otps
  for all using (true);


-- ============================================================================
-- Functions (✅ verified bodies from pg_get_functiondef)
-- ============================================================================

-- Auto-create a profile row on signup (trigger lives on auth.users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- Random unique 8-digit order id. Production has NO trigger calling this
-- (verified: zero triggers on public tables), but every production order carries
-- ids in this exact range — so it's the source of track_id values, invoked
-- outside the schema (manually or by deployed code). schema.sql wires it as the
-- orders.track_id DEFAULT so a fresh DB works standalone.
create or replace function public.generate_track_id()
returns integer
language plpgsql
as $$
declare
  new_id int4;
begin
  loop
    -- تولید عدد تصادفی بین 10000000 و 99999999
    new_id := floor(random() * 90000000) + 10000000;
    -- اطمینان از اینکه تکراری نیست
    exit when not exists (
      select 1 from orders where track_id = new_id
    );
  end loop;
  return new_id;
end;
$$;


-- Lookup a user id by phone number (dormant — not called by the app)
create or replace function public.get_user_id_by_phone(phone_number text)
returns uuid
language plpgsql
security definer
as $$
declare
  found_user_id uuid;
begin
  select id into found_user_id from auth.users where phone = phone_number;
  return found_user_id;
end;
$$;


-- Set displayName in auth.users raw_app_meta_data (dormant — not called by the app)
create or replace function public.update_user_display_name(target_user_id uuid, new_display_name text)
returns void
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{displayName}',
    to_jsonb(new_display_name),
    true
  )
  where id = target_user_id;
end;
$$;


-- ============================================================================
-- Grants (Supabase defaults)
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;


-- ============================================================================
-- RESOLVED — orders.track_id population
-- ============================================================================
-- Verified: no trigger (pg_trigger), no sequence (pg_sequences: only
-- settings_id_seq exists), no OpenAPI-visible default, and this repo's checkout
-- never writes it. Production orders DO carry random 8-digit ids matching
-- generate_track_id(), so ids are produced by that function somewhere outside
-- the schema. The file now adds `default public.generate_track_id()` so a fresh
-- database works out of the box (random unique ids, collision-safe via the
-- function's uniqueness loop).
-- ============================================================================


-- ============================================================================
-- SECURITY NOTES (deliberate deviations you may want to reconsider)
-- ============================================================================
-- The file reproduces production exactly, including these risky settings:
--
--   1. orders / order_items: SELECT policies are PUBLIC (qual=true). Anyone —
--      no login needed — can read every order: customer names, addresses,
--      phone numbers, payment references. This is load-bearing for the public
--      /track/{track_id} page, but it exposes ALL orders, not just the one
--      being tracked. A safer design keeps tracking public but hides the rest,
--      e.g. expose a SECURITY DEFINER function `get_order_by_track_id(int)`
--      that returns only the fields the tracking page needs, then lock the
--      tables down to owner-only.
--
--   2. settings: RLS disabled — anon can read AND write the store config.
--      Enable RLS and add a select-all + admin-update policy.
--
--   3. discounts: only a SELECT policy exists; writes are service_role-only
--      (fine), but codes are validated CLIENT-SIDE in checkout — anyone can
--      read the codes table and forge a discount. Move validation server-side.
--
--   4. products / phone_cases / posters: any authenticated user can
--      insert/update/delete (admin checks are app-level only).
--
--   5. otps: "all everyone" — full public read/write. Table is dormant, but
--      if it's ever used for OTP auth this is a serious hole.
-- ============================================================================
