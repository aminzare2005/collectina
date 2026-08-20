import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { VariantRepository } from "@/lib/repositories";

/**
 * GET /api/admin/posters
 * Returns all posters (admin management).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posters = await VariantRepository.getAllPosters();
  return NextResponse.json(posters);
}

/**
 * POST /api/admin/posters
 * Create a new poster (admin).
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await request.json();
  const poster = await VariantRepository.createPoster(data);
  return NextResponse.json(poster);
}

/**
 * PUT /api/admin/posters
 * Update a poster (admin).
 */
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...data } = await request.json();
  const poster = await VariantRepository.updatePoster(id, data);
  return NextResponse.json(poster);
}

/**
 * DELETE /api/admin/posters?id=xxx
 * Delete a poster (admin).
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

  await VariantRepository.deletePoster(id);
  return NextResponse.json({ success: true });
}
