import { NextResponse } from "next/server";
import { getPaymentRegistry } from "@/lib/payments";

/**
 * GET /api/payment/gateways
 *
 * Returns list of available payment gateways for the checkout UI.
 */
export async function GET() {
  try {
    const registry = getPaymentRegistry();
    const gateways = registry.getAvailableGateways();

    return NextResponse.json({
      success: true,
      gateways,
      defaultGateway: "zibal", //  gateways[0]?.id || null
    });
  } catch (error) {
    console.error("Error fetching gateways:", error);
    return NextResponse.json(
      { success: false, gateways: [], defaultGateway: null },
      { status: 500 },
    );
  }
}
