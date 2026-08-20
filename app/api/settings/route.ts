import { NextResponse } from "next/server";
import { SettingsRepository } from "@/lib/repositories";

/**
 * GET /api/settings
 * Returns app settings (public — used by cart page for post_price).
 */
export async function GET() {
  const settings = await SettingsRepository.get();
  return NextResponse.json(settings);
}
