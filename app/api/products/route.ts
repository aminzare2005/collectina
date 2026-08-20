import { NextRequest, NextResponse } from "next/server";
import { getCachedFeed } from "@/lib/cache";

/**
 * GET /api/products?type=phonecase&offset=0&limit=20&feed=true
 * Returns paginated product feed for infinite-scroll grids.
 *
 * The feed is identical for every visitor and only changes through the admin
 * panel, so responses are cached for 60s (in-process + CDN via Cache-Control).
 */
export async function GET(request: NextRequest) {
  const type = (request.nextUrl.searchParams.get("type") ?? "phonecase") as "phonecase" | "poster";
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
  const feedOnly = request.nextUrl.searchParams.get("feed") !== "false";

  const products = await getCachedFeed(type, offset, limit, feedOnly);
  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
