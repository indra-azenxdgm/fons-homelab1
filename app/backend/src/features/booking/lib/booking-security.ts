import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { db } from "@/lib/prisma";
import {
  PUBLIC_RATE_LIMIT_POLICIES,
  enforcePublicRateLimit,
} from "@/features/booking/lib/public-rate-limit";

type SecurityLogInput = {
  outcome: "accepted" | "rejected" | "suspicious";
  reason: string;
  ipAddress?: string | null;
  phone?: string | null;
  userAgent?: string | null;
  submissionKey?: string | null;
  payload?: Record<string, unknown>;
};

type RequestSecurityContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export class BookingSecurityError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status = 400,
    fieldErrors?: Record<string, string[]>,
    code = "booking_rejected",
  ) {
    super(message);
    this.name = "BookingSecurityError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const MIN_BOOKING_COMPLETION_MS = 2500;

export function getRequestSecurityContext(request: Request): RequestSecurityContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp || null,
    userAgent: request.headers.get("user-agent"),
  };
}

function maskPhoneNumber(phone: string | null | undefined) {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/[^\d]/g, "");

  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}***`;
  }

  return `${digits.slice(0, 4)}***${digits.slice(-2)}`;
}

export async function logBookingSecurityEvent(input: SecurityLogInput) {
  try {
    await db.submissionAttemptLog.create({
      data: {
        channel: "booking",
        outcome: input.outcome,
        reason: input.reason,
        ipAddress: input.ipAddress || null,
        phone: maskPhoneNumber(input.phone),
        userAgent: input.userAgent || null,
        submissionKey: input.submissionKey || null,
        payload: (input.payload || undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.warn("Failed to persist booking security log", error);
  }
}

export async function enforceBookingRateLimit(
  request: Request,
) {
  enforcePublicRateLimit(request, PUBLIC_RATE_LIMIT_POLICIES.bookingCreate);
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  context: RequestSecurityContext,
) {
  const enabled = process.env.TURNSTILE_ENABLED === "true";

  if (!enabled) {
    return;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new BookingSecurityError(
      "Verifikasi sedang bermasalah. Silakan coba lagi beberapa saat lagi.",
      500,
      undefined,
      "anti_bot_unavailable",
    );
  }

  if (!token) {
    await logBookingSecurityEvent({
      outcome: "rejected",
      reason: "turnstile_token_missing",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    throw new BookingSecurityError(
      "Sesi verifikasi berakhir. Silakan coba lagi.",
      400,
      { turnstileToken: ["Sesi verifikasi berakhir. Silakan coba lagi."] },
      "turnstile_token_missing",
    );
  }

  const formData = new URLSearchParams();
  formData.set("secret", secret);
  formData.set("response", token);
  if (context.ipAddress) {
    formData.set("remoteip", context.ipAddress);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    },
  );

  const result = (await response.json()) as {
    success?: boolean;
  };

  if (!result.success) {
    await logBookingSecurityEvent({
      outcome: "rejected",
      reason: "turnstile_verification_failed",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    throw new BookingSecurityError(
      "Verifikasi gagal. Silakan coba lagi.",
      400,
      { turnstileToken: ["Verifikasi gagal. Silakan coba lagi."] },
      "turnstile_verification_failed",
    );
  }
}

export async function rejectHoneypotAttempt(input: {
  website?: string | null;
  phone?: string | null;
  submissionKey?: string | null;
  payload?: Record<string, unknown>;
  context: RequestSecurityContext;
}) {
  if (!input.website) {
    return;
  }

  await logBookingSecurityEvent({
    outcome: "suspicious",
    reason: "honeypot_triggered",
    ipAddress: input.context.ipAddress,
    phone: input.phone,
    userAgent: input.context.userAgent,
    submissionKey: input.submissionKey,
    payload: input.payload,
  });

  throw new BookingSecurityError(
    "Pemesanan belum bisa diproses saat ini. Silakan muat ulang halaman lalu coba lagi.",
    400,
    undefined,
    "suspicious_submission_blocked",
  );
}

export async function rejectTooFastSubmission(input: {
  startedAt?: number | null;
  phone?: string | null;
  submissionKey?: string | null;
  payload?: Record<string, unknown>;
  context: RequestSecurityContext;
}) {
  if (!input.startedAt || !Number.isFinite(input.startedAt)) {
    return;
  }

  const elapsedMs = Date.now() - input.startedAt;

  if (elapsedMs >= MIN_BOOKING_COMPLETION_MS) {
    return;
  }

  await logBookingSecurityEvent({
    outcome: "suspicious",
    reason: "submission_too_fast",
    ipAddress: input.context.ipAddress,
    phone: input.phone,
    userAgent: input.context.userAgent,
    submissionKey: input.submissionKey,
    payload: {
      ...(input.payload || {}),
      elapsedMs,
    },
  });

  throw new BookingSecurityError(
    "Pemesanan belum bisa diproses saat ini. Silakan muat ulang halaman lalu coba lagi.",
    400,
    undefined,
    "suspicious_submission_blocked",
  );
}

export function isDuplicateSubmissionError(error: unknown) {
  return (
    error instanceof PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
