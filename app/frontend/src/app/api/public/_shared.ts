import { NextResponse } from "next/server";

import { buildApiUrl } from "@/lib/api-client";
import { getInternalApiBaseUrl } from "@/lib/env";

type ProxyRequestInit = {
  method?: "GET" | "POST";
  requestHeaders?: Headers;
  headers?: HeadersInit;
  body?: BodyInit | null;
};

export async function proxyPublicApi(
  path: string,
  init: ProxyRequestInit = {},
) {
  try {
    const backendResponse = await fetch(
      buildApiUrl(path, getInternalApiBaseUrl()),
      {
        cache: "no-store",
        method: init.method || "GET",
        headers: {
          ...(init.requestHeaders?.get("user-agent")
            ? { "user-agent": init.requestHeaders.get("user-agent") as string }
            : {}),
          ...(init.requestHeaders?.get("x-forwarded-for")
            ? { "x-forwarded-for": init.requestHeaders.get("x-forwarded-for") as string }
            : {}),
          ...(init.requestHeaders?.get("x-real-ip")
            ? { "x-real-ip": init.requestHeaders.get("x-real-ip") as string }
            : {}),
          ...(init.requestHeaders?.get("cf-connecting-ip")
            ? { "cf-connecting-ip": init.requestHeaders.get("cf-connecting-ip") as string }
            : {}),
          ...(init.requestHeaders?.get("content-type")
            ? { "content-type": init.requestHeaders.get("content-type") as string }
            : {}),
          ...(init.headers || {}),
        },
        body: init.body,
      },
    );

    const text = await backendResponse.text();

    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error(`[api/public proxy] failed for ${path}`, error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          category: "system",
          code: "backend_unavailable",
          message: "Layanan booking sedang tidak tersedia. Silakan coba lagi beberapa saat lagi.",
        },
      },
      { status: 502 },
    );
  }
}
