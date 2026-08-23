import { type NextRequest, NextResponse } from "next/server";
import { getPaymentRegistry } from "@/lib/payments";
import { getCurrentUser } from "@/lib/auth-helpers";
import { OrderRepository, CartRepository } from "@/lib/repositories";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const success = searchParams.get("success");
  const trackId = searchParams.get("trackId");
  const orderId = searchParams.get("orderId");

  if (success === "1" && trackId) {
    try {
      const registry = getPaymentRegistry();
      const result = await registry.verify({
        trackId,
        success,
      });

      if (result.verified) {
        await OrderRepository.updateStatus(orderId!, "paid");

        const user = await getCurrentUser();

        if (user) {
          await CartRepository.deleteAllForUser(user.id);
        }

        return NextResponse.redirect(new URL(`/order-success?orderId=${orderId}`, request.url));
      }
    } catch (error) {
      console.error("Payment verification error:", error);
    }
  }

  return NextResponse.redirect(new URL(`/order-failed?orderId=${orderId}`, request.url));
}
