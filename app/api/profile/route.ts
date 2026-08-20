import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { UserRepository } from "@/lib/repositories";

/**
 * GET /api/profile
 * Returns the current user's profile.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await UserRepository.getById(user.id);
  return NextResponse.json(profile);
}

/**
 * PATCH /api/profile
 * Update the current user's profile.
 * Body: { display_name?, address?, city?, postal_code?, telegram? }
 */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const profile = await UserRepository.update(user.id, data);
  return NextResponse.json(profile);
}
