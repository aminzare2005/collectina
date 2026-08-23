import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { OrderRepository } from "@/lib/repositories";
import { STATUS_LABELS } from "@/lib/types/order-status";

const VALID_STATUSES = Object.keys(STATUS_LABELS);

/**
 * POST /api/orders/[orderId]/status
 *
 * Updates order status.
 * - Admin can change any order to any status.
 * - Regular user can only change their own order from 'pending' to 'pending_card_verification'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const admin = await isAdmin();

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "وضعیت نامعتبر است" },
        { status: 400 },
      );
    }

    const order = await OrderRepository.getById(orderId);
    if (!order) {
      return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
    }

    // Admin can change any order to any status
    if (admin) {
      await OrderRepository.updateStatus(orderId, status);
      return NextResponse.json({ success: true, status });
    }

    // Regular user: only card-to-card flow (pending → pending_card_verification)
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (status === "pending_card_verification") {
      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "فقط سفارش‌های در انتظار پرداخت قابل بروزرسانی هستند" },
          { status: 400 },
        );
      }
    }

    await OrderRepository.updateStatus(orderId, status);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی وضعیت" },
      { status: 500 },
    );
  }
}
