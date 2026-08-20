import { NextRequest, NextResponse } from "next/server";
import { ProductRepository } from "@/lib/repositories";

/**
 * GET /api/products/[id]?type=phonecase
 * Returns a single product by id + type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const type = (request.nextUrl.searchParams.get("type") ?? "phonecase") as "phonecase" | "poster";

  const product = await ProductRepository.getById(id, type);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
