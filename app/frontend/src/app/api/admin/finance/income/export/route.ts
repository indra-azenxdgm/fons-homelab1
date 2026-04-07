import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || null;

    if (!token) {
      return NextResponse.json({ error: { category: "security", code: "unauthorized_admin", message: "Unauthorized" } }, { status: 401 });
    }

    const search = new URL(request.url).search;
    const backendResponse = await fetch(buildApiUrl(`/api/admin/finance/income/export${search}`, getInternalApiBaseUrl()), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      const payload = await backendResponse.json().catch(() => null);
      return NextResponse.json(payload, { status: backendResponse.status });
    }

    const data = await backendResponse.arrayBuffer();
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": backendResponse.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": backendResponse.headers.get("content-disposition") || "attachment",
      },
    });
  } catch (error) {
    console.error("[api/admin/finance/income/export] backend proxy failed", error);
    return NextResponse.json({ error: { category: "system", code: "backend_unavailable", message: "Unable to export income right now" } }, { status: 502 });
  }
}
