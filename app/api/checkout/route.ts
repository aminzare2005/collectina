import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  CartRepository,
  DiscountRepository,
  OrderRepository,
  UserRepository,
} from "@/lib/repositories";
import { getPaymentRegistry } from "@/lib/payments";

/**
 * POST /api/checkout
 *
 * Server-side checkout flow. This is the critical security improvement —
 * total amount and discount validation now happen on the server, not the client.
 *
 * Body: {
 *   displayName: string,
 *   phoneNumber: string,
 *   address: string,
 *   city: string,
 *   postalCode: string,
 *   telegram?: string,
 *   discountCode?: string,
 *   total: number,  // client-reported total (server recalculates)
 * }
 *
 * Returns: { orderId, paymentStartUrl, trackId }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      displayName,
      phoneNumber,
      address,
      city,
      postalCode,
      telegram,
      discountCode,
      gateway,
    } = body;

    // 1. Fetch cart items with full details
    const cartItems = await CartRepository.getByUserId(user.id);
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "سبد خرید خالی است" }, { status: 400 });
    }

    // 2. Server-side total calculation
    let serverTotal = 0;
    for (const item of cartItems) {
      const product = item.product as Record<string, unknown>;
      const phoneCase = item.phone_case as Record<string, unknown> | null;
      const poster = item.poster as Record<string, unknown> | null;

      if (product.type === "phonecase" && phoneCase) {
        serverTotal += (phoneCase.price as number) * item.quantity;
      } else if (product.type === "poster" && poster) {
        serverTotal += parseInt(poster.price as string, 10) * item.quantity;
      }
    }

    // 3. Server-side discount validation
    let discountId: string | null = null;
    let discountAmount = 0;
    let freeShipping = false;

    if (discountCode) {
      const discount = await DiscountRepository.getByCode(discountCode);
      if (discount && discount.is_active) {
        const now = new Date();
        const startsOk = !discount.starts_at || new Date(discount.starts_at) <= now;
        const expiresOk = !discount.expires_at || new Date(discount.expires_at) >= now;

        if (startsOk && expiresOk) {
          // Check min order amount
          if (!discount.min_order_amount || serverTotal >= discount.min_order_amount) {
            // Check usage limit
            let usageOk = true;
            if (discount.usage_limit) {
              const totalUsage = await DiscountRepository.countTotalUsages(discount.id);
              if (totalUsage >= discount.usage_limit) usageOk = false;
            }
            if (discount.usage_per_user) {
              const userUsage = await DiscountRepository.countUserUsages(discount.id, user.id);
              if (userUsage >= discount.usage_per_user) usageOk = false;
            }

            if (usageOk) {
              discountId = discount.id;

              if (discount.type === "percentage" && discount.value) {
                discountAmount = Math.floor((serverTotal * discount.value) / 100);
                if (discount.max_discount_amount) {
                  discountAmount = Math.min(discountAmount, discount.max_discount_amount);
                }
              } else if (discount.type === "fixed" && discount.value) {
                discountAmount = Math.min(discount.value, serverTotal);
              } else if (discount.type === "free_shipping") {
                freeShipping = true;
              }
            }
          }
        }
      }
    }

    const finalTotal = Math.max(serverTotal - discountAmount, 0);

    // 4. Create order
    const order = await OrderRepository.create({
      user_id: user.id,
      total_amount: finalTotal,
      status: "pending",
      shipping_address: address,
      shipping_city: city,
      shipping_postal_code: postalCode,
      phone_number: phoneNumber,
      telegram: telegram || undefined,
      receiver_name: displayName,
      discount_id: discountId,
      discount_amount: discountAmount,
      free_shipping: freeShipping,
    });

    // 5. Create order items
    const orderItems = cartItems.map((item) => {
      const product = item.product as Record<string, unknown>;
      const phoneCase = item.phone_case as Record<string, unknown> | null;
      const poster = item.poster as Record<string, unknown> | null;

      const base = {
        product_id: product.id as string,
        product_name: (product.name as string) || "",
        quantity: item.quantity,
      };

      if (product.type === "phonecase" && phoneCase) {
        return {
          ...base,
          product_price: phoneCase.price as number,
          phone_case_id: phoneCase.id as string,
          phone_brand: phoneCase.brand as string,
          phone_model: phoneCase.model as string,
          poster_atr: undefined,
          poster_id: undefined,
        };
      }

      if (product.type === "poster" && poster) {
        return {
          ...base,
          product_price: parseInt(poster.price as string, 10),
          phone_case_id: undefined,
          phone_brand: undefined,
          phone_model: undefined,
          poster_atr: poster.attribute as string,
          poster_id: poster.id as string,
        };
      }

      throw new Error(`Invalid product type: ${product.type}`);
    });

    await OrderRepository.createItems(order.id, orderItems);

    // 6. Update user profile
    await UserRepository.update(user.id, {
      display_name: displayName,
      phone_number: phoneNumber,
      address,
      city,
      postal_code: postalCode,
      telegram: telegram || undefined,
    });

    // 7. Record discount usage
    if (discountId) {
      await DiscountRepository.recordUsage(discountId, user.id, order.id);
    }

    // 8. Initiate payment using the gateway system
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "App URL is not configured" }, { status: 500 });
    }

    const callbackUrl = `${appUrl}/api/payment/verify?orderId=${encodeURIComponent(order.id)}`;
    const registry = getPaymentRegistry();

    const paymentResult = await registry.createRequest(
      {
        orderId: order.id,
        amountInToman: finalTotal,
        callbackUrl,
        description: `پرداخت سفارش ${order.id}`,
      },
      gateway, // Optional: user-selected gateway
    );

    if (paymentResult.success && paymentResult.trackId) {
      // For card-to-card, don't store payment reference (no external payment)
      if (gateway !== "card-to-card") {
        await OrderRepository.updatePaymentReference(order.id, paymentResult.trackId);
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        trackId: paymentResult.trackId,
        paymentStartUrl: paymentResult.paymentUrl,
      });
    }

    return NextResponse.json(
      { error: paymentResult.message || "خطا در ایجاد درگاه پرداخت" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "مشکلی در ثبت سفارش پیش آمد",
      },
      { status: 500 },
    );
  }
}
