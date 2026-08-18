import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyZibalPayment } from "@/lib/zibal-proxy"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const success = searchParams.get("success")
  const trackId = searchParams.get("trackId")
  const orderId = searchParams.get("orderId")

  const supabase = await createClient()

  if (success === "1" && trackId) {
    try {
      const data = await verifyZibalPayment(trackId)

      if (data.result === 100) {
        await supabase
          .from("orders")
          .update({
            status: "paid",
          })
          .eq("id", orderId)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase.from("cart_items").delete().eq("user_id", user.id)
        }

        return NextResponse.redirect(new URL(`/order-success?orderId=${orderId}`, request.url))
      }
    } catch (error) {
      console.error("Payment verification error:", error)
    }
  }

  return NextResponse.redirect(new URL(`/order-failed?orderId=${orderId}`, request.url))
}
