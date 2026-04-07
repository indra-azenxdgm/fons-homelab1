import type { Request } from "express";

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

type RateLimitPolicy = {
  key: string;
  windowMs: number;
  maxRequests: number;
  code: string;
  message: string;
};

declare global {
  var backendRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore = globalThis.backendRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalThis.backendRateLimitStore) {
  globalThis.backendRateLimitStore = rateLimitStore;
}

export class BackendRateLimitError extends Error {
  status: number;
  code: string;
  retryAfterSeconds: number;

  constructor(policy: RateLimitPolicy, retryAfterSeconds: number) {
    super(policy.message);
    this.name = "BackendRateLimitError";
    this.status = 429;
    this.code = policy.code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  const realIp = request.headers["x-real-ip"];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const realValue = Array.isArray(realIp) ? realIp[0] : realIp;

  return forwardedValue?.split(",")[0]?.trim() || realValue || request.ip || "anonymous";
}

export const BACKEND_RATE_LIMIT_POLICIES = {
  adminLogin: {
    key: "admin_login",
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
    code: "admin_login_rate_limited",
    message: "Too many sign-in attempts. Please wait a few minutes and try again.",
  },
} satisfies Record<string, RateLimitPolicy>;

export function enforceBackendRateLimit(request: Request, policy: RateLimitPolicy) {
  const key = `${policy.key}:${getClientIp(request)}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.expiresAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      expiresAt: now + policy.windowMs,
    });
    return;
  }

  if (entry.count >= policy.maxRequests) {
    throw new BackendRateLimitError(
      policy,
      Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
    );
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
}
