import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { SettingsRepository } from "@/lib/repositories";

/**
 * GET /api/admin/settings
 * Returns app settings (admin).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await SettingsRepository.get();
  return NextResponse.json(settings);
}

/**
 * PUT /api/admin/settings
 * Update app settings (admin).
 */
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await request.json();
  const settings = await SettingsRepository.update(data);
  return NextResponse.json(settings);
}
