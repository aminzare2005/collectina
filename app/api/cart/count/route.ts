import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { CartRepository } from "@/lib/repositories";

/**
 * GET /api/cart/count
 * Returns the number of cart items for the current user.
 * Used by the header badge.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await CartRepository.countByUserId(user.id);
  return NextResponse.json({ count });
}
