import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { ProductRepository } from "@/lib/repositories";

/**
 * GET /api/admin/products
 * Returns all products (admin management).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const phonecaseProducts = await ProductRepository.getFeed("phonecase", 0, 10000, false);
  const posterProducts = await ProductRepository.getFeed("poster", 0, 10000, false);
  const all = [...phonecaseProducts, ...posterProducts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return NextResponse.json(all);
}

/**
 * POST /api/admin/products
 * Create a new product (admin).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const product = await ProductRepository.create(data);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/products
 * Update a product (admin).
 */
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...data } = await request.json();
  const product = await ProductRepository.update(id, data);
  return NextResponse.json(product);
}

/**
 * DELETE /api/admin/products?id=xxx
 * Delete a product (admin).
 */
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await ProductRepository.delete(id);
  return NextResponse.json({ success: true });
}
