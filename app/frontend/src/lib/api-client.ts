import { getBrowserApiBaseUrl, getInternalApiBaseUrl } from "@/lib/env";

type BackendFetchOptions = RequestInit & {
  authToken?: string | null;
  baseUrl?: string;
};

export class BackendApiError extends Error {
  status: number;
  data: unknown;
  code?: string;
  category?: string;

  constructor(message: string, status: number, data: unknown, options?: { code?: string; category?: string }) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.data = data;
    this.code = options?.code;
    this.category = options?.category;
  }
}

function getErrorPayload(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as { error?: unknown };

  if (!payload.error || typeof payload.error !== "object") {
    return null;
  }

  const error = payload.error as { message?: unknown; code?: unknown; category?: unknown };
  return {
    message: typeof error.message === "string" ? error.message : null,
    code: typeof error.code === "string" ? error.code : undefined,
    category: typeof error.category === "string" ? error.category : undefined,
  };
}

function resolveBaseUrl(explicitBaseUrl?: string) {
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (typeof window === "undefined") {
    return getInternalApiBaseUrl();
  }

  return getBrowserApiBaseUrl();
}

function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => reviveDates(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, reviveDates(entry)]),
    ) as T;
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
    return new Date(value) as T;
  }

  return value;
}

export function buildApiUrl(path: string, baseUrl?: string) {
  const origin = resolveBaseUrl(baseUrl).replace(/\/$/, "");
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${pathname}`;
}

export async function fetchBackendJson<T>(
  path: string,
  options: BackendFetchOptions = {},
) {
  const { authToken, headers, baseUrl, ...rest } = options;
  const response = await fetch(buildApiUrl(path, baseUrl), {
    cache: "no-store",
    credentials: typeof window === "undefined" ? rest.credentials : (rest.credentials ?? "include"),
    ...rest,
    headers: {
      ...(headers || {}),
      ...(authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload = getErrorPayload(data);
    throw new BackendApiError(
      errorPayload?.message
        || (typeof data === "object" && data && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? String((data as { error?: unknown }).error || "Backend request failed")
          : "Backend request failed"),
      response.status,
      data,
      {
        code: errorPayload?.code,
        category: errorPayload?.category,
      },
    );
  }

  return reviveDates(data as T);
}
