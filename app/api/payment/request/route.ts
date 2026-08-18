import { type NextRequest, NextResponse } from "next/server"
import { createZibalPaymentRequest } from "@/lib/zibal-proxy"

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      return NextResponse.json(
        { success: false, message: "App URL is not configured" },
        { status: 500 },
      )
    }

    const callbackUrl = `${appUrl}/api/payment/verify?orderId=${encodeURIComponent(orderId)}`
    const data = await createZibalPaymentRequest({
      orderId,
      amountInRials: amount * 10,
      callbackUrl,
      description: `پرداخت سفارش ${orderId}`,
    })

    if (data.result === 100 && data.trackId) {
      const appBaseUrl = appUrl.replace(/\/$/, "")

      return NextResponse.json({
        success: true,
        trackId: data.trackId,
        paymentStartUrl: `${appBaseUrl}/api/payment/start?trackId=${data.trackId}`,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: data.message || "Payment request failed",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Payment request error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
