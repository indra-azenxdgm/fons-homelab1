import "server-only";

import { fetchBackendJson } from "@/lib/api-client";
import { getAdminAuthToken } from "@/features/admin/lib/auth";

export async function fetchAdminApi<T>(path: string) {
  const token = await getAdminAuthToken();

  return fetchBackendJson<T>(path, {
    authToken: token,
  });
}

export function toQueryString(input: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}
