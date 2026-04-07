import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;

    if (token) {
      await fetch(buildApiUrl("/api/admin/auth/logout", getInternalApiBaseUrl()), {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
  } catch (error) {
    console.error("[api/admin/logout] frontend logout failed", error);

    return NextResponse.json({
      error: {
        category: "system",
        code: "logout_failed",
        message: "Unable to sign out right now",
      },
    }, { status: 500 });
  }
}
