-- ============================================================================
-- Migration: product feed composite index (performance)
-- Date: 2026-08-20
--
-- Why: the storefront grids paginate with
--   WHERE type = $1 AND feed = true ORDER BY pin DESC, created_at DESC
-- (ProductRepository.getFeed / getPinned, served by /api/products).
-- The single-column indexes on (type), (feed), (pin), (created_at) cannot
-- satisfy that ORDER BY, so Postgres seq-scans + sorts the whole products
-- table on every paginated request.
--
-- This composite index lets Postgres walk the exact (type, feed, pin,
-- created_at) range in the requested order — index-only scan, no sort.
--
-- Run on production (safe, CREATE INDEX IF NOT EXISTS — no lock issue for
-- a small table; use CONCURRENTLY if the table grows large):
--
--   psql $DATABASE_URL -f scripts/migrations/2026-08-20-product-feed-index.sql
-- ============================================================================

CREATE INDEX IF NOT EXISTS products_feed_query_idx
  ON public.products (type, feed, pin DESC, created_at DESC);

-- Optional sanity check:
--   \di products_feed_query_idx
--   EXPLAIN ANALYZE SELECT * FROM products
--     WHERE type = 'phonecase' AND feed = true
--     ORDER BY pin DESC, created_at DESC
--     OFFSET 0 LIMIT 8;
--   -- should show "Index Scan using products_feed_query_idx" and no Sort node
