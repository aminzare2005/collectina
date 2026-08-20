import { NextResponse } from "next/server";
import { getCachedSettings } from "@/lib/cache";

/**
 * GET /api/settings
 * Returns app settings (public — used by cart page for post_price).
 * Cached for 60s (settings change only through the admin panel).
 */
export async function GET() {
  const settings = await getCachedSettings();
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
