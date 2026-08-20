import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";
import { getStorageProvider } from "@/lib/storage";

/**
 * POST /api/upload
 * Upload an image file to storage (admin only).
 * Used by the custom upload flow.
 *
 * FormData fields:
 *   - file: the image file
 *   - type: "phonecase" | "poster" | "product" (used in the file name)
 *
 * File naming format: [YYYY-MM-DD]-[HH-MM-SS]-[type].[ext]
 *   e.g. "2026-08-20-14-30-00-phonecase.png"
 *
 * Returns: { url: string } — the public URL of the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: "file and type are required" },
        { status: 400 },
      );
    }

    if (!["phonecase", "poster", "product"].includes(type)) {
      return NextResponse.json(
        { error: "type must be 'phonecase', 'poster', or 'product'" },
        { status: 400 },
      );
    }

    // Build filename: YYYY-MM-DD-HH-MM-SS-type.ext
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // "2026-08-20"
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // "14-30-00"
    const fileExt = file.name.split(".").pop() ?? "png";
    const fileName = `${dateStr}-${timeStr}-${type}.${fileExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageProvider();
    const url = await storage.upload(fileName, buffer, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
