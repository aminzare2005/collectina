import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { OrderRepository } from "@/lib/repositories";

/**
 * GET /api/orders/[orderId]
 *
 * Returns order details for the card-to-card payment page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    const order = await OrderRepository.getById(orderId);

    if (!order) {
      return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }

    // Verify the order belongs to the user
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: order.id,
      totalAmount: order.total_amount,
      status: order.status,
    });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات سفارش" },
      { status: 500 },
    );
  }
}
