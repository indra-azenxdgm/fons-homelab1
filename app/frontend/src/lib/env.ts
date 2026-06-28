const DEFAULT_PRODUCTION_SITE_URL = "https://www.fonsjogjaac.com";
const DEFAULT_DEVELOPMENT_SITE_URL = "http://localhost:3004";

function getRequiredEnv(key: "INTERNAL_API_BASE_URL" | "NEXT_PUBLIC_API_BASE_URL") {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function validateInternalApiBaseUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid INTERNAL_API_BASE_URL: expected http or https URL, got ${value}`);
  }

  return `${url.protocol}//${url.host}`;
}

function normalizeSiteUrl(value: string) {
  const url = new URL(value);

  return `${url.protocol}//${url.host}`;
}

function shouldUseBrowserSameOrigin(value: string) {
  const hostname = new URL(value).hostname.toLowerCase();

  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "frontend"
    || hostname === "fons_frontend";
}

export function getInternalApiBaseUrl() {
  const value = process.env.INTERNAL_API_BASE_URL;

  if (value) {
    return validateInternalApiBaseUrl(value);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: INTERNAL_API_BASE_URL");
  }

  return validateInternalApiBaseUrl("http://localhost:3001");
}

export function getBrowserApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window !== "undefined") {
    if (!value || (process.env.NODE_ENV === "production" && shouldUseBrowserSameOrigin(value))) {
      return window.location.origin;
    }
  }

  return value || getRequiredEnv("NEXT_PUBLIC_API_BASE_URL");
}

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_SITE_URL : DEFAULT_DEVELOPMENT_SITE_URL);

  return normalizeSiteUrl(value);
}

export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Fon's",
  city: process.env.NEXT_PUBLIC_SERVICE_CITY || "Yogyakarta",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "087819995004",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL
    || (process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_SITE_URL : "http://localhost:3001"),
  siteUrl: getSiteUrl(),
  turnstileEnabled:
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "true" ||
    process.env.TURNSTILE_ENABLED === "true",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
} as const;
