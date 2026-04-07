import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const useSecureCookie = forwardedProto === "https" || requestUrl.protocol === "https:";
    const body = await request.text();
    const backendResponse = await fetch(buildApiUrl("/api/admin/auth/login", getInternalApiBaseUrl()), {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const payload = await backendResponse.json().catch(() => null) as
      | {
          token?: string;
          adminUser?: {
            id: string;
            email: string;
            name: string;
            role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
            availableNotificationTypes: Array<
              "BOOKING_CREATED" | "BOOKING_STATUS_CHANGED" | "BOOKING_SQUADS_UPDATED" | "BOOKING_ATTENTION_REQUIRED"
            >;
            notificationPreferences: {
              toastEnabled: boolean;
              soundEnabled: boolean;
              typePreferences: Record<
                "BOOKING_CREATED" | "BOOKING_STATUS_CHANGED" | "BOOKING_SQUADS_UPDATED" | "BOOKING_ATTENTION_REQUIRED",
                boolean
              >;
            };
            mustChangePassword: boolean;
          };
        }
      | null;

    if (!backendResponse.ok || !payload?.token || !payload.adminUser) {
      return NextResponse.json(
        payload || {
          error: {
            category: "system",
            code: "admin_login_proxy_failed",
            message: "Unable to sign in",
          },
        },
        { status: backendResponse.status || 500 },
      );
    }

    const response = NextResponse.json({
      adminUser: payload.adminUser,
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: payload.token,
      httpOnly: true,
      sameSite: "lax",
      secure: useSecureCookie,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("[api/admin/login] backend auth proxy failed", error);

    return NextResponse.json({
      error: {
        category: "system",
        code: "backend_unavailable",
        message: "Unable to sign in right now",
      },
    }, { status: 502 });
  }
}
