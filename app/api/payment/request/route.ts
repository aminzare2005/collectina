import { type NextRequest, NextResponse } from "next/server";
import { getPaymentRegistry } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, gateway } = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { success: false, message: "App URL is not configured" },
        { status: 500 },
      );
    }

    const callbackUrl = `${appUrl}/api/payment/verify?orderId=${encodeURIComponent(orderId)}`;
    const registry = getPaymentRegistry();

    const result = await registry.createRequest(
      {
        orderId,
        amountInToman: amount,
        callbackUrl,
        description: `پرداخت سفارش ${orderId}`,
      },
      gateway, // Optional: specify gateway ID, or use default
    );

    if (result.success && result.trackId) {
      return NextResponse.json({
        success: true,
        trackId: result.trackId,
        paymentStartUrl: result.paymentUrl,
        gateway: result.gateway,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message || "Payment request failed",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Payment request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
