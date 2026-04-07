import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";

type AdminAuthAuditEvent =
  | "login"
  | "logout"
  | "api_access";

type AdminAuthAuditOutcome =
  | "success"
  | "failure"
  | "rejected";

export type AdminAuthRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

type LogAdminAuthEventInput = {
  adminUserId?: string | null;
  event: AdminAuthAuditEvent;
  outcome: AdminAuthAuditOutcome;
  reason?: string | null;
  identifier?: string | null;
  metadata?: Record<string, unknown>;
  context?: AdminAuthRequestContext;
};

export function getAdminRequestContext(request: Request): AdminAuthRequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp || null,
    userAgent: request.headers.get("user-agent"),
  };
}

function maskEmailAddress(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return null;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] || "*"}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export async function logAdminAuthEvent(input: LogAdminAuthEventInput) {
  try {
    await db.adminAuthLog.create({
      data: {
        adminUserId: input.adminUserId || null,
        event: input.event,
        outcome: input.outcome,
        reason: input.reason || null,
        identifier: maskEmailAddress(input.identifier),
        ipAddress: input.context?.ipAddress || null,
        userAgent: input.context?.userAgent || null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.warn("Failed to persist admin auth log", error);
  }
}
