import {
  ProductRepository,
  SettingsRepository,
  VariantRepository,
} from "@/lib/repositories";
import type { PhoneCase, Poster, Product, Settings } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Tiny in-process TTL cache.
//
// Why: the phone-case/poster catalogs and the settings row are identical for
// every visitor and change only through the admin panel. Without caching we
// hit the DB on every page render / API call, and every hit costs a full
// network round trip to the database host.
//
// This is a plain module-level Map — no framework API, works on Vercel and
// Liara alike. Each server instance keeps its own copy; admin mutations call
// `invalidateCache(...)` so changes appear immediately instead of waiting for
// the TTL.
// ---------------------------------------------------------------------------

const TTL = {
  settings: 60_000, // 1 min — admin settings changes show up quickly
  catalog: 5 * 60_000, // 5 min — phone case / poster variants
  feed: 60_000, // 1 min — product grid pages
} as const;

const store = new Map<string, { value: unknown; expiresAt: number }>();

async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }
  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/** Drop every cached entry whose key starts with `prefix`. */
export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Settings (single row — used by ShouldIRender on every page)
// ---------------------------------------------------------------------------

export function getCachedSettings(): Promise<Settings | null> {
  return cached("settings", TTL.settings, () => SettingsRepository.get());
}

// ---------------------------------------------------------------------------
// Phone case catalog (global: brand + model + price, shared by all products)
// ---------------------------------------------------------------------------

/** Slim catalog — only the fields the storefront selectors need. */
export type PhoneCaseCatalogItem = Pick<
  PhoneCase,
  "id" | "brand" | "model" | "price" | "available"
>;

export function getCachedPhoneCases(): Promise<PhoneCase[]> {
  return cached("catalog:phone-cases", TTL.catalog, () =>
    VariantRepository.getAllPhoneCases(),
  );
}

export async function getCachedPhoneCaseCatalog(): Promise<PhoneCaseCatalogItem[]> {
  const rows = await cached("catalog:phone-cases:slim", TTL.catalog, async () => {
    const all = await getCachedPhoneCases();
    return all.map(({ id, brand, model, price, available }) => ({
      id,
      brand,
      model,
      price,
      available,
    }));
  });
  return rows as PhoneCaseCatalogItem[];
}

// ---------------------------------------------------------------------------
// Poster catalog (global: attribute + price, shared by all products)
// ---------------------------------------------------------------------------

/** Slim catalog — only the fields the storefront selectors need. */
export type PosterCatalogItem = Pick<
  Poster,
  "id" | "attribute" | "price" | "available"
>;

export function getCachedPosters(): Promise<Poster[]> {
  return cached("catalog:posters", TTL.catalog, () =>
    VariantRepository.getAllPosters(),
  );
}

export async function getCachedPosterCatalog(): Promise<PosterCatalogItem[]> {
  const rows = await cached("catalog:posters:slim", TTL.catalog, async () => {
    const all = await getCachedPosters();
    return all.map(({ id, attribute, price, available }) => ({
      id,
      attribute,
      price,
      available,
    }));
  });
  return rows as PosterCatalogItem[];
}

// ---------------------------------------------------------------------------
// Product feed pages (infinite-scroll grids)
// ---------------------------------------------------------------------------

export function getCachedFeed(
  type: "phonecase" | "poster",
  offset: number,
  limit: number,
  feedOnly = true,
): Promise<Product[]> {
  return cached(
    `feed:${type}:${offset}:${limit}:${feedOnly}`,
    TTL.feed,
    () => ProductRepository.getFeed(type, offset, limit, feedOnly),
  );
}
