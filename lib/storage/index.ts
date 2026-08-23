import type { StorageProvider } from "./types";
import { S3StorageProvider } from "./s3.provider";
import { SupabaseStorageProvider } from "./supabase.provider";

/**
 * Get the active storage provider.
 *
 * During migration (Phase 1-6): returns S3StorageProvider if S3 env vars are
 * configured, otherwise falls back to SupabaseStorageProvider.
 * After migration (Phase 7+): only S3StorageProvider is used.
 *
 * This singleton is created once per process.
 */
let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  // Prefer S3 if configured
  if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY) {
    _provider = new S3StorageProvider();
  } else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Fallback to Supabase Storage during transition
    _provider = new SupabaseStorageProvider();
  } else {
    throw new Error(
      "No storage provider configured. Set S3_ENDPOINT + S3_ACCESS_KEY for S3, or NEXT_PUBLIC_SUPABASE_URL for Supabase.",
    );
  }

  return _provider;
}

let _tempProvider: StorageProvider | null = null;

/**
 * Get storage provider for temporary uploads (e.g., card-to-card receipts).
 * Uses S3_TEMP_BUCKET env var if set, otherwise falls back to main bucket.
 */
export function getTempStorageProvider(): StorageProvider {
  if (_tempProvider) return _tempProvider;

  const tempBucket = process.env.S3_TEMP_BUCKET;
  if (tempBucket && process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY) {
    _tempProvider = new S3StorageProvider(tempBucket);
  } else {
    // Fallback to main storage provider
    _tempProvider = getStorageProvider();
  }

  return _tempProvider;
}

export type { StorageProvider } from "./types";
