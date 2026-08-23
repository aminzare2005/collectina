import { NextResponse } from "next/server";
import { getPaymentRegistry } from "@/lib/payments";

/**
 * GET /api/payment/card-details
 *
 * Returns card-to-card payment details (card number + holder name).
 * Only works if CARD_TO_CARD_NUMBER is configured.
 */
export async function GET() {
  try {
    const registry = getPaymentRegistry();

    if (!registry.hasGateway("card-to-card")) {
      return NextResponse.json(
        { error: "پرداخت کارت به کارت فعال نیست" },
        { status: 404 },
      );
    }

    const gateway = registry.getGateway("card-to-card") as unknown as {
      getCardDetails: () => { number: string; holderName: string };
    };

    const details = gateway.getCardDetails();

    return NextResponse.json({
      number: details.number,
      holderName: details.holderName,
    });
  } catch (error) {
    console.error("Error fetching card details:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کارت" },
      { status: 500 },
    );
  }
}
