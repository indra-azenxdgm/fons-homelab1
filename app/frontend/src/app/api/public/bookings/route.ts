import { proxyPublicApi } from "@/app/api/public/_shared";

export async function POST(request: Request) {
  const body = await request.text();

  return proxyPublicApi("/api/public/bookings", {
    method: "POST",
    requestHeaders: request.headers,
    body,
  });
}
