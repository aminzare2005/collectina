import { NextRequest, NextResponse } from "next/server";
import { ProductRepository } from "@/lib/repositories";

/**
 * GET /api/products?type=phonecase&offset=0&limit=20&feed=true
 * Returns paginated product feed for infinite-scroll grids.
 */
export async function GET(request: NextRequest) {
  const type = (request.nextUrl.searchParams.get("type") ?? "phonecase") as "phonecase" | "poster";
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
  const feedOnly = request.nextUrl.searchParams.get("feed") !== "false";

  const products = await ProductRepository.getFeed(type, offset, limit, feedOnly);
  return NextResponse.json(products);
}
