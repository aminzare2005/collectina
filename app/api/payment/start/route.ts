import { type NextRequest, NextResponse } from "next/server";
import { getPaymentRegistry } from "@/lib/payments";

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get("trackId")?.replace(/\D/g, "");
  const gateway = request.nextUrl.searchParams.get("gateway");

  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 });
  }

  try {
    const registry = getPaymentRegistry();
    const paymentUrl = registry.getPaymentUrl(trackId, gateway || undefined);
    return NextResponse.redirect(paymentUrl);
  } catch (error) {
    console.error("Payment start error:", error);
    return NextResponse.json(
      { error: "Invalid gateway or payment configuration" },
      { status: 400 },
    );
  }
}
