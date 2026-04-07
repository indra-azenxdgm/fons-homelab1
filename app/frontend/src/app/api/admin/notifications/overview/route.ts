import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;

    if (!token) {
      return NextResponse.json({
        error: {
          category: "security",
          code: "unauthorized_admin",
          message: "Unauthorized",
        },
      }, { status: 401 });
    }

    const backendResponse = await fetch(
      buildApiUrl("/api/admin/notifications/overview", getInternalApiBaseUrl()),
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const payload = await backendResponse.json().catch(() => null);
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("[api/admin/notifications/overview] backend proxy failed", error);

    return NextResponse.json({
      error: {
        category: "system",
        code: "backend_unavailable",
        message: "Unable to load notification overview right now",
      },
    }, { status: 502 });
  }
}
