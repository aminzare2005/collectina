import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { CartRepository } from "@/lib/repositories";

/**
 * GET /api/cart
 * Returns all cart items for the current user with product + variant data.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await CartRepository.getByUserId(user.id);
  return NextResponse.json(items);
}

/**
 * POST /api/cart
 * Add an item to the cart.
 * Body: { productId: string, phoneCaseId?: string }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, phoneCaseId, posterId } = await request.json();

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const item = await CartRepository.addOrUpdate(user.id, productId, phoneCaseId, posterId);
  return NextResponse.json(item);
}

/**
 * PATCH /api/cart
 * Update cart item quantity.
 * Body: { id: string, quantity: number }
 */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, quantity } = await request.json();

  if (!id || quantity === undefined) {
    return NextResponse.json({ error: "id and quantity are required" }, { status: 400 });
  }

  const item = await CartRepository.setQuantity(id, quantity);
  return NextResponse.json(item);
}

/**
 * DELETE /api/cart?id=xxx
 * Remove a cart item.
 */
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await CartRepository.delete(id);
  return NextResponse.json({ success: true });
}
