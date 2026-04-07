type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

type RateLimitPolicy = {
  key: string;
  windowMs: number;
  maxRequests: number;
  message: string;
  code: string;
};

declare global {
  var publicRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore = globalThis.publicRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalThis.publicRateLimitStore) {
  globalThis.publicRateLimitStore = rateLimitStore;
}

export const PUBLIC_RATE_LIMIT_POLICIES = {
  bookingAvailability: {
    key: "booking_availability",
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    message: "Terlalu sering memuat ketersediaan jadwal. Silakan tunggu sebentar lalu coba lagi.",
    code: "availability_rate_limited",
  },
  bookingCreate: {
    key: "booking_create",
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: "Terlalu banyak percobaan booking. Silakan tunggu beberapa menit lalu coba lagi.",
    code: "booking_rate_limited",
  },
  reverseGeocode: {
    key: "reverse_geocode",
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
    message: "Terlalu sering meminta alamat otomatis. Silakan tunggu sebentar lalu coba lagi.",
    code: "reverse_geocode_rate_limited",
  },
} satisfies Record<string, RateLimitPolicy>;

export class PublicRateLimitError extends Error {
  status: number;
  code: string;
  retryAfterSeconds: number;

  constructor(policy: RateLimitPolicy, retryAfterSeconds: number) {
    super(policy.message);
    this.name = "PublicRateLimitError";
    this.status = 429;
    this.code = policy.code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
}

export function enforcePublicRateLimit(
  request: Request,
  policy: RateLimitPolicy,
) {
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
    throw new PublicRateLimitError(
      policy,
      Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
    );
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
}
