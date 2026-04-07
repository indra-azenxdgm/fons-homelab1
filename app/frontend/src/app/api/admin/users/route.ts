import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

export async function POST(request: Request) {
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

    const body = await request.text();
    const backendResponse = await fetch(
      buildApiUrl("/api/admin/users", getInternalApiBaseUrl()),
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      },
    );

    const payload = await backendResponse.json().catch(() => null);
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("[api/admin/users] backend proxy failed", error);

    return NextResponse.json({
      error: {
        category: "system",
        code: "backend_unavailable",
        message: "Unable to create user right now",
      },
    }, { status: 502 });
  }
}
