import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

export async function GET() {
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

    const backendResponse = await fetch(buildApiUrl("/api/admin/settings/company-profile", getInternalApiBaseUrl()), {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await backendResponse.json().catch(() => null);
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("[api/admin/settings/company-profile] backend load failed", error);
    return NextResponse.json({
      error: {
        category: "system",
        code: "backend_unavailable",
        message: "Unable to load company profile right now",
      },
    }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.text();
    const backendResponse = await fetch(buildApiUrl("/api/admin/settings/company-profile", getInternalApiBaseUrl()), {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const payload = await backendResponse.json().catch(() => null);
    return NextResponse.json(payload, { status: backendResponse.status });
  } catch (error) {
    console.error("[api/admin/settings/company-profile] backend update failed", error);
    return NextResponse.json({
      error: {
        category: "system",
        code: "backend_unavailable",
        message: "Unable to save company profile right now",
      },
    }, { status: 502 });
  }
}
