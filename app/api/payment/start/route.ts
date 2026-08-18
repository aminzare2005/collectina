import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get("trackId")?.replace(/\D/g, "")

  if (!trackId) {
    return NextResponse.json({ error: "trackId is required" }, { status: 400 })
  }

  return NextResponse.redirect(`https://gateway.zibal.ir/start/${trackId}`)
}
