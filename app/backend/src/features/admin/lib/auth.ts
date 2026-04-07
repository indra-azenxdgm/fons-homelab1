import { createHash, randomBytes } from "node:crypto";

import { backendEnv } from "@/config/env";
import type { AdminShellUser } from "@/features/admin/lib/contracts";
import {
  hasAllPermissions,
  hasAnyPermission,
  type AdminPermission,
  type AdminRole,
} from "@/features/admin/lib/permissions";
import {
  getAdminPasswordValidationMessage,
  hashAdminPassword,
  verifyAdminPassword,
} from "@/features/admin/lib/password";
import {
  getAvailableNotificationTypesForRole,
  normalizeAdminNotificationPreferences,
} from "@/features/admin/lib/server/admin-notifications";
import { db } from "@/lib/prisma";

export type AdminSessionUser = AdminShellUser;
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export class AdminAuthorizationError extends Error {
  status: number;

  constructor(message: "UNAUTHORIZED_ADMIN" | "FORBIDDEN_ADMIN", status = 401) {
    super(message);
    this.name = "AdminAuthorizationError";
    this.status = status;
  }
}

const adminUserWithNotificationPreferences = db.adminUser as unknown as {
  findUnique(args: {
    where: {
      email?: string;
      id?: string;
    };
    select: {
      id: true;
      email: true;
      name: true;
      role: true;
      mustChangePassword: true;
      isActive: true;
      passwordHash?: true;
      notificationPreferences?: true;
    };
  }): Promise<{
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    mustChangePassword: boolean;
    isActive: boolean;
    passwordHash?: string;
    notificationPreferences?: unknown;
  } | null>;
};

const adminSessionStore = (db as unknown as {
  adminSession: {
    create(args: {
      data: {
        adminUserId: string;
        tokenHash: string;
        expiresAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
        lastUsedAt: Date;
      };
      select: {
        id: true;
      };
    }): Promise<{ id: string }>;
    updateMany(args: {
      where: Record<string, unknown>;
      data: {
        revokedAt: Date;
      };
    }): Promise<unknown>;
    findUnique(args: {
      where: {
        id: string;
      };
      select: {
        id: true;
        tokenHash: true;
        expiresAt: true;
        revokedAt: true;
        lastUsedAt: true;
        adminUser: {
          select: {
            id: true;
            email: true;
            name: true;
            role: true;
            mustChangePassword: true;
            isActive: true;
            notificationPreferences: true;
          };
        };
      };
    }): Promise<{
      id: string;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
      lastUsedAt: Date | null;
      adminUser: {
        id: string;
        email: string;
        name: string;
        role: AdminRole;
        mustChangePassword: boolean;
        isActive: boolean;
        notificationPreferences?: unknown;
      } | null;
    } | null>;
    update(args: {
      where: {
        id: string;
      };
      data: {
        lastUsedAt: Date;
      };
    }): Promise<unknown>;
    deleteMany(args: {
      where: Record<string, unknown>;
    }): Promise<unknown>;
  };
}).adminSession;

function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionSecret(secret: string) {
  return createHash("sha256")
    .update(`${backendEnv.adminSessionSecret}:${secret}`)
    .digest("hex");
}

function parseSessionToken(token: string) {
  const [sessionId, sessionSecret] = token.split(".");

  if (!sessionId || !sessionSecret) {
    return null;
  }

  return {
    sessionId,
    sessionSecret,
  };
}

function getSessionExpiryDate() {
  return new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
}

function getSessionCleanupCutoffDate() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

function toAdminSessionUser(adminUser: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mustChangePassword: boolean;
  notificationPreferences?: unknown;
}) {
  return {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
    availableNotificationTypes: getAvailableNotificationTypesForRole(adminUser.role),
    notificationPreferences: normalizeAdminNotificationPreferences(
      adminUser.notificationPreferences,
      adminUser.role,
    ),
    mustChangePassword: adminUser.mustChangePassword,
  } satisfies AdminSessionUser;
}

export async function createAdminSessionToken(
  adminUserId: string,
  context?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  void cleanupExpiredAdminSessions().catch(() => null);
  const sessionSecret = randomBytes(32).toString("hex");
  const session = await adminSessionStore.create({
    data: {
      adminUserId,
      tokenHash: hashSessionSecret(sessionSecret),
      expiresAt: getSessionExpiryDate(),
      ipAddress: context?.ipAddress || null,
      userAgent: context?.userAgent || null,
      lastUsedAt: new Date(),
    },
    select: {
      id: true,
    },
  });

  return `${session.id}.${sessionSecret}`;
}

export async function cleanupExpiredAdminSessions() {
  await adminSessionStore.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lte: new Date(),
          },
        },
        {
          revokedAt: {
            lte: getSessionCleanupCutoffDate(),
          },
        },
      ],
    },
  });
}

export async function revokeAdminSessionToken(token: string | null | undefined) {
  if (!token) {
    return;
  }

  const parsedToken = parseSessionToken(token);

  if (!parsedToken) {
    return;
  }

  await adminSessionStore.updateMany({
    where: {
      id: parsedToken.sessionId,
      tokenHash: hashSessionSecret(parsedToken.sessionSecret),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeAdminSessionsForUser(
  adminUserId: string,
  options?: {
    exceptSessionToken?: string | null;
  },
) {
  const exceptParsedToken = options?.exceptSessionToken
    ? parseSessionToken(options.exceptSessionToken)
    : null;

  await adminSessionStore.updateMany({
    where: {
      adminUserId,
      revokedAt: null,
      ...(exceptParsedToken
        ? {
            NOT: {
              id: exceptParsedToken.sessionId,
              tokenHash: hashSessionSecret(exceptParsedToken.sessionSecret),
            },
          }
        : {}),
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function authenticateAdminCredentials(email: string, password: string) {
  const normalizedEmail = normalizeAdminEmail(email);

  if (!normalizedEmail || !password) {
    return {
      ok: false as const,
      reason: "missing_credentials",
    };
  }

  const adminUser = await adminUserWithNotificationPreferences.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePassword: true,
      isActive: true,
      notificationPreferences: true,
      passwordHash: true,
    },
  });

  if (!adminUser) {
    return {
      ok: false as const,
      reason: "admin_not_found",
    };
  }

  if (!adminUser.isActive) {
    return {
      ok: false as const,
      reason: "inactive_admin",
    };
  }

  if (!adminUser.passwordHash) {
    return {
      ok: false as const,
      reason: "invalid_password",
    };
  }

  const passwordMatches = await verifyAdminPassword(password, adminUser.passwordHash);

  if (!passwordMatches) {
    return {
      ok: false as const,
      reason: "invalid_password",
    };
  }

  await db.adminUser.update({
    where: {
      id: adminUser.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  return {
    ok: true as const,
    adminUser: toAdminSessionUser(adminUser),
  };
}

export async function getAdminUserFromToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const parsedToken = parseSessionToken(token);

  if (!parsedToken) {
    return null;
  }

  const session = await adminSessionStore.findUnique({
    where: {
      id: parsedToken.sessionId,
    },
    select: {
      id: true,
      tokenHash: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      adminUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          mustChangePassword: true,
          isActive: true,
          notificationPreferences: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  if (session.tokenHash !== hashSessionSecret(parsedToken.sessionSecret)) {
    return null;
  }

  const adminUser = session.adminUser;

  if (!adminUser || !adminUser.isActive) {
    return null;
  }

  if (!session.lastUsedAt || (Date.now() - session.lastUsedAt.getTime()) > 5 * 60 * 1000) {
    void adminSessionStore.update({
      where: {
        id: session.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    }).catch(() => null);
  }

  return toAdminSessionUser(adminUser);
}

export async function changeAdminPasswordWithCurrentPassword(
  adminUserId: string,
  currentPassword: string,
  nextPassword: string,
  options?: {
    currentSessionToken?: string | null;
  },
) {
  const passwordValidationMessage = getAdminPasswordValidationMessage(nextPassword);

  if (passwordValidationMessage) {
    throw new Error("PASSWORD_POLICY_INVALID");
  }

  const adminUser = await db.adminUser.findUnique({
    where: {
      id: adminUserId,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      mustChangePassword: true,
    },
  });

  if (!adminUser) {
    throw new Error("ADMIN_USER_NOT_FOUND");
  }

  const passwordMatches = await verifyAdminPassword(currentPassword, adminUser.passwordHash);

  if (!passwordMatches) {
    throw new Error("CURRENT_PASSWORD_INVALID");
  }

  const nextPasswordHash = await hashAdminPassword(nextPassword);
  const exceptParsedToken = options?.currentSessionToken
    ? parseSessionToken(options.currentSessionToken)
    : null;

  await db.$transaction([
    db.adminUser.update({
      where: {
        id: adminUser.id,
      },
      data: {
        passwordHash: nextPasswordHash,
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
      },
    }),
    db.adminAuthLog.create({
      data: {
        adminUserId,
        event: "admin_password_changed",
        outcome: "succeeded",
        reason: adminUser.mustChangePassword
          ? "forced_password_change_completed"
          : "self_password_changed",
        identifier: adminUser.email,
        metadata: {
          targetUserId: adminUserId,
          targetEmail: adminUser.email,
          forcedPasswordChange: adminUser.mustChangePassword,
        },
      },
    }),
  ]);

  await revokeAdminSessionsForUser(adminUserId, {
    exceptSessionToken: options?.currentSessionToken || null,
  });
}

export function adminHasPermission(
  adminUser: Pick<AdminSessionUser, "role">,
  permission: AdminPermission,
) {
  return hasAnyPermission(adminUser.role, [permission]);
}

export function adminHasAllPermissions(
  adminUser: Pick<AdminSessionUser, "role">,
  permissions: AdminPermission[],
) {
  return hasAllPermissions(adminUser.role, permissions);
}

export async function requireAdminAuthFromToken(token: string | null | undefined, allowedRoles?: AdminRole[]) {
  const adminUser = await getAdminUserFromToken(token);

  if (!adminUser) {
    throw new AdminAuthorizationError("UNAUTHORIZED_ADMIN", 401);
  }

  if (allowedRoles?.length && !allowedRoles.includes(adminUser.role)) {
    throw new AdminAuthorizationError("FORBIDDEN_ADMIN", 403);
  }

  return adminUser;
}

export async function requireAdminPermissionFromToken(
  token: string | null | undefined,
  permission: AdminPermission,
) {
  const adminUser = await requireAdminAuthFromToken(token);

  if (!adminHasPermission(adminUser, permission)) {
    throw new AdminAuthorizationError("FORBIDDEN_ADMIN", 403);
  }

  return adminUser;
}
