import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requirePermission } from "@/features/admin/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

const maxLogoFileSize = 3 * 1024 * 1024;
const allowedMimeTypes = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/webp", ".webp"],
]);

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || null;

    if (!token) {
      return NextResponse.json({
        error: {
          category: "security",
          code: "unauthorized_admin",
          message: "Unauthorized",
        },
      }, { status: 401 });
    }

    try {
      await requirePermission("settings.manage");
    } catch (error) {
      if (error instanceof Error && (error.message === "UNAUTHORIZED_ADMIN" || error.message === "FORBIDDEN_ADMIN")) {
        return NextResponse.json({
          error: {
            category: "security",
            code: error.message === "FORBIDDEN_ADMIN" ? "forbidden_admin" : "unauthorized_admin",
            message: error.message === "FORBIDDEN_ADMIN" ? "Forbidden" : "Unauthorized",
          },
        }, { status: error.message === "FORBIDDEN_ADMIN" ? 403 : 401 });
      }

      throw error;
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({
        error: {
          category: "validation",
          code: "logo_file_required",
          message: "Choose a logo file before uploading",
        },
      }, { status: 400 });
    }

    const extension = allowedMimeTypes.get(fileEntry.type);

    if (!extension) {
      return NextResponse.json({
        error: {
          category: "validation",
          code: "invalid_logo_file_type",
          message: "Upload a PNG, JPG, JPEG, or WEBP image",
        },
      }, { status: 400 });
    }

    if (fileEntry.size > maxLogoFileSize) {
      return NextResponse.json({
        error: {
          category: "validation",
          code: "logo_file_too_large",
          message: "Logo file must be 3 MB or smaller",
        },
      }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "company-profile");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `company-logo-${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      success: true,
      logoUrl: `/uploads/company-profile/${fileName}`,
    });
  } catch (error) {
    console.error("[api/admin/settings/company-profile/logo] upload failed", error);
    return NextResponse.json({
      error: {
        category: "system",
        code: "logo_upload_failed",
        message: "Unable to upload the company logo right now",
      },
    }, { status: 500 });
  }
}
