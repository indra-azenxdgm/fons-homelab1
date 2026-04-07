import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_PRODUCTION_SITE_URL = "https://www.fonsjogjaac.com";
const INTERNAL_ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "frontend", "fons_frontend"]);

function normalizeHost(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.split(",")[0]?.trim().toLowerCase();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/:\d+$/, "");
}

function getProductionPrimaryHost() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PRODUCTION_SITE_URL;

  return new URL(siteUrl).hostname.toLowerCase();
}

function getRequestHosts(request: NextRequest) {
  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host"));

  if (forwardedHost) {
    return [forwardedHost];
  }

  return [normalizeHost(request.headers.get("host")), normalizeHost(request.nextUrl.hostname)]
    .filter((host): host is string => Boolean(host));
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const productionPrimaryHost = getProductionPrimaryHost();
  const requestHosts = getRequestHosts(request);

  if (
    requestHosts.some((host) => host === productionPrimaryHost)
    || requestHosts.some((host) => INTERNAL_ALLOWED_HOSTS.has(host))
  ) {
    return NextResponse.next();
  }

  return new NextResponse("Unsupported host", {
    status: 404,
    headers: {
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fons.png|fons-header.png).*)",
  ],
};
