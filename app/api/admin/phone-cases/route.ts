import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { invalidateCache } from "@/lib/cache";
import { VariantRepository } from "@/lib/repositories";

/**
 * GET /api/admin/phone-cases
 * Returns all phone cases (admin management).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cases = await VariantRepository.getAllPhoneCases();
  return NextResponse.json(cases);
}

/**
 * POST /api/admin/phone-cases
 * Create a new phone case (admin).
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await request.json();
  const phoneCase = await VariantRepository.createPhoneCase(data);
  invalidateCache("catalog");
  return NextResponse.json(phoneCase);
}

/**
 * PUT /api/admin/phone-cases
 * Update a phone case (admin).
 */
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...data } = await request.json();
  const phoneCase = await VariantRepository.updatePhoneCase(id, data);
  invalidateCache("catalog");
  return NextResponse.json(phoneCase);
}

/**
 * DELETE /api/admin/phone-cases?id=xxx
 * Delete a phone case (admin).
 */
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await VariantRepository.deletePhoneCase(id);
  invalidateCache("catalog");
  return NextResponse.json({ success: true });
}
