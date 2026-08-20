import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { DiscountRepository, CartRepository } from "@/lib/repositories";

/**
 * POST /api/discount/validate
 *
 * Validates a discount code against the user's cart.
 * Returns discount info if valid.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code, total } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const discount = await DiscountRepository.getByCode(code.trim());
    if (!discount || !discount.is_active) {
      return NextResponse.json(
        { error: "کد تخفیف معتبر نیست" },
        { status: 404 },
      );
    }

    // Date window check
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return NextResponse.json(
        { error: "کد تخفیف دیگه اعتبار نداره!" },
        { status: 400 },
      );
    }
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return NextResponse.json(
        { error: "کد تخفیف دیگه اعتبار نداره!" },
        { status: 400 },
      );
    }

    // Min order amount
    const cartTotal = total || 0;
    if (discount.min_order_amount && cartTotal < discount.min_order_amount) {
      return NextResponse.json(
        {
          error: `حداقل مبلغ سفارش برای این کد ${new Intl.NumberFormat("fa-IR").format(discount.min_order_amount)} تومان است`,
        },
        { status: 400 },
      );
    }

    // Usage limit
    if (discount.usage_limit) {
      const totalUsage = await DiscountRepository.countTotalUsages(discount.id);
      if (totalUsage >= discount.usage_limit) {
        return NextResponse.json(
          { error: "کد تخفیف دیگه اعتبار نداره!" },
          { status: 400 },
        );
      }
    }

    // Per-user limit
    if (discount.usage_per_user) {
      const userUsage = await DiscountRepository.countUserUsages(
        discount.id,
        user.id,
      );
      if (userUsage >= discount.usage_per_user) {
        return NextResponse.json(
          { error: "قبلا از این کد استفاده کردی" },
          { status: 400 },
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    let freeShipping = false;

    if (discount.type === "percentage") {
      discountAmount = Math.floor((cartTotal * (discount.value || 0)) / 100);
      if (discount.max_discount_amount) {
        discountAmount = Math.min(discountAmount, discount.max_discount_amount);
      }
    } else if (discount.type === "fixed") {
      discountAmount = Math.min(discount.value || 0, cartTotal);
    } else if (discount.type === "free_shipping") {
      freeShipping = true;
    }

    return NextResponse.json({
      discountId: discount.id,
      discountAmount,
      freeShipping,
    });
  } catch (error) {
    console.error("Discount validation error:", error);
    return NextResponse.json(
      { error: "خطا در بررسی کد تخفیف" },
      { status: 500 },
    );
  }
}
