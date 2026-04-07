import { proxyPublicApi } from "@/app/api/public/_shared";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyPublicApi(`/api/public/location/reverse-geocode${search}`, {
    requestHeaders: request.headers,
  });
}
