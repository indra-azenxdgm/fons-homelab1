import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

async function proxy(request: Request, expenseId: string, method: "PATCH" | "DELETE") {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || null;

  if (!token) {
    return NextResponse.json({ error: { category: "security", code: "unauthorized_admin", message: "Unauthorized" } }, { status: 401 });
  }

  const backendResponse = await fetch(buildApiUrl(`/api/admin/finance/expenses/${encodeURIComponent(expenseId)}`, getInternalApiBaseUrl()), {
    method,
    cache: "no-store",
    headers: {
      ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: method === "PATCH" ? await request.text() : undefined,
  });

  const payload = await backendResponse.json().catch(() => null);
  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function PATCH(request: Request, context: { params: Promise<{ expenseId: string }> }) {
  try {
    return await proxy(request, (await context.params).expenseId, "PATCH");
  } catch (error) {
    console.error("[api/admin/finance/expenses/[expenseId]] patch proxy failed", error);
    return NextResponse.json({ error: { category: "system", code: "backend_unavailable", message: "Unable to update expense record right now" } }, { status: 502 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ expenseId: string }> }) {
  try {
    return await proxy(request, (await context.params).expenseId, "DELETE");
  } catch (error) {
    console.error("[api/admin/finance/expenses/[expenseId]] delete proxy failed", error);
    return NextResponse.json({ error: { category: "system", code: "backend_unavailable", message: "Unable to delete expense record right now" } }, { status: 502 });
  }
}
