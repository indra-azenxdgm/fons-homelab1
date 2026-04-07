import { AdminRole, BookingStatus } from "@prisma/client";

import { hasPermission } from "@/features/admin/lib/permissions";
import type {
  AdminNotificationPreferences,
  AdminNotificationRules,
  AdminNotificationSeverity,
  AdminNotificationType,
  AdminRole as AdminRoleContract,
} from "@/features/admin/lib/contracts";
import { db } from "@/lib/prisma";

export type AdminNotificationItem = {
  id: string;
  type: AdminNotificationType;
  severity: AdminNotificationSeverity;
  title: string;
  message: string;
  detail: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
  bookingId: string | null;
  archivedAt: Date | null;
  archivedReason: string | null;
  audienceType: string;
  audienceRole: string | null;
};

const adminNotificationSelect = {
  id: true,
  type: true,
  severity: true,
  title: true,
  message: true,
  detail: true,
  href: true,
  readAt: true,
  createdAt: true,
  bookingId: true,
  archivedAt: true,
  archivedReason: true,
  audienceType: true,
  audienceRole: true,
};

type NotificationAudienceType =
  | "GLOBAL_ADMIN"
  | "ROLE_TARGETED"
  | "USER_TARGETED";

type NotificationAuditMetadata = {
  eventType: AdminNotificationType;
  severity?: AdminNotificationSeverity;
  alertKey?: string;
  staleHours?: number;
  bookingCode?: string;
  customerName?: string;
  previousStatus?: string;
  nextStatus?: string;
  previousSquads?: string;
  nextSquads?: string;
  targetSquadIds?: string[];
  recipientRole?: string;
  recipientReason?: string;
  audienceType: NotificationAudienceType;
};

type NotificationRecipient = {
  id: string;
  role: AdminRoleContract;
  audienceType: NotificationAudienceType;
  audienceRole: string | null;
  recipientReason: string;
};

export const adminNotificationTypes: AdminNotificationType[] = [
  "BOOKING_CREATED",
  "BOOKING_STATUS_CHANGED",
  "BOOKING_SQUADS_UPDATED",
  "BOOKING_ATTENTION_REQUIRED",
];

export function getAvailableNotificationTypesForRole(role: AdminRoleContract) {
  if (role === "SQUAD") {
    return adminNotificationTypes.filter((type) => type !== "BOOKING_CREATED");
  }

  return adminNotificationTypes;
}

export function getDefaultNotificationPreferences(
  role: AdminRoleContract,
): AdminNotificationPreferences {
  const availableTypes = getAvailableNotificationTypesForRole(role);

  return {
    toastEnabled: true,
    soundEnabled: false,
    typePreferences: {
      BOOKING_CREATED: availableTypes.includes("BOOKING_CREATED"),
      BOOKING_STATUS_CHANGED: availableTypes.includes("BOOKING_STATUS_CHANGED"),
      BOOKING_SQUADS_UPDATED: availableTypes.includes("BOOKING_SQUADS_UPDATED"),
      BOOKING_ATTENTION_REQUIRED: availableTypes.includes("BOOKING_ATTENTION_REQUIRED"),
    },
  };
}

export function normalizeAdminNotificationPreferences(
  value: unknown,
  role: AdminRoleContract,
): AdminNotificationPreferences {
  const defaults = getDefaultNotificationPreferences(role);

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const raw = value as {
    toastEnabled?: unknown;
    soundEnabled?: unknown;
    typePreferences?: Partial<Record<AdminNotificationType, unknown>>;
  };

  return {
    toastEnabled:
      typeof raw.toastEnabled === "boolean"
        ? raw.toastEnabled
        : defaults.toastEnabled,
    soundEnabled:
      typeof raw.soundEnabled === "boolean"
        ? raw.soundEnabled
        : defaults.soundEnabled,
    typePreferences: {
      BOOKING_CREATED:
        typeof raw.typePreferences?.BOOKING_CREATED === "boolean"
          ? raw.typePreferences.BOOKING_CREATED
          : defaults.typePreferences.BOOKING_CREATED,
      BOOKING_STATUS_CHANGED:
        typeof raw.typePreferences?.BOOKING_STATUS_CHANGED === "boolean"
          ? raw.typePreferences.BOOKING_STATUS_CHANGED
          : defaults.typePreferences.BOOKING_STATUS_CHANGED,
      BOOKING_SQUADS_UPDATED:
        typeof raw.typePreferences?.BOOKING_SQUADS_UPDATED === "boolean"
          ? raw.typePreferences.BOOKING_SQUADS_UPDATED
          : defaults.typePreferences.BOOKING_SQUADS_UPDATED,
      BOOKING_ATTENTION_REQUIRED:
        typeof raw.typePreferences?.BOOKING_ATTENTION_REQUIRED === "boolean"
          ? raw.typePreferences.BOOKING_ATTENTION_REQUIRED
          : defaults.typePreferences.BOOKING_ATTENTION_REQUIRED,
    },
  };
}

export function getDefaultAdminNotificationRules(): AdminNotificationRules {
  return {
    digestCadence: "daily",
    eventTypeEnabled: {
      BOOKING_CREATED: true,
      BOOKING_STATUS_CHANGED: true,
      BOOKING_SQUADS_UPDATED: true,
      BOOKING_ATTENTION_REQUIRED: true,
    },
    sla: {
      enabled: true,
      pendingHours: 2,
      confirmedHours: 4,
      assignedHours: 6,
      inProgressHours: 12,
    },
  };
}

export function normalizeAdminNotificationRules(value: unknown): AdminNotificationRules {
  const defaults = getDefaultAdminNotificationRules();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const raw = value as {
    digestCadence?: unknown;
    eventTypeEnabled?: Partial<Record<AdminNotificationType, unknown>>;
    sla?: {
      enabled?: unknown;
      pendingHours?: unknown;
      confirmedHours?: unknown;
      assignedHours?: unknown;
      inProgressHours?: unknown;
    };
  };

  return {
    digestCadence: raw.digestCadence === "weekly" ? "weekly" : "daily",
    eventTypeEnabled: {
      BOOKING_CREATED:
        typeof raw.eventTypeEnabled?.BOOKING_CREATED === "boolean"
          ? raw.eventTypeEnabled.BOOKING_CREATED
          : defaults.eventTypeEnabled.BOOKING_CREATED,
      BOOKING_STATUS_CHANGED:
        typeof raw.eventTypeEnabled?.BOOKING_STATUS_CHANGED === "boolean"
          ? raw.eventTypeEnabled.BOOKING_STATUS_CHANGED
          : defaults.eventTypeEnabled.BOOKING_STATUS_CHANGED,
      BOOKING_SQUADS_UPDATED:
        typeof raw.eventTypeEnabled?.BOOKING_SQUADS_UPDATED === "boolean"
          ? raw.eventTypeEnabled.BOOKING_SQUADS_UPDATED
          : defaults.eventTypeEnabled.BOOKING_SQUADS_UPDATED,
      BOOKING_ATTENTION_REQUIRED:
        typeof raw.eventTypeEnabled?.BOOKING_ATTENTION_REQUIRED === "boolean"
          ? raw.eventTypeEnabled.BOOKING_ATTENTION_REQUIRED
          : defaults.eventTypeEnabled.BOOKING_ATTENTION_REQUIRED,
    },
    sla: {
      enabled:
        typeof raw.sla?.enabled === "boolean"
          ? raw.sla.enabled
          : defaults.sla.enabled,
      pendingHours:
        typeof raw.sla?.pendingHours === "number"
          ? Math.max(1, raw.sla.pendingHours)
          : defaults.sla.pendingHours,
      confirmedHours:
        typeof raw.sla?.confirmedHours === "number"
          ? Math.max(1, raw.sla.confirmedHours)
          : defaults.sla.confirmedHours,
      assignedHours:
        typeof raw.sla?.assignedHours === "number"
          ? Math.max(1, raw.sla.assignedHours)
          : defaults.sla.assignedHours,
      inProgressHours:
        typeof raw.sla?.inProgressHours === "number"
          ? Math.max(1, raw.sla.inProgressHours)
          : defaults.sla.inProgressHours,
    },
  };
}

const adminNotification = (
  db as typeof db & {
    adminNotification: {
      createMany(args: {
        data: Array<{
          adminUserId: string;
          bookingId?: string | null;
          type: string;
          severity?: string;
          title: string;
          message: string;
          detail?: string | null;
          href?: string | null;
          audienceType: string;
          audienceRole?: string | null;
          auditMetadata?: NotificationAuditMetadata | null;
        }>;
      }): Promise<unknown>;
      findMany(args: {
        where: unknown;
        orderBy: Array<{ createdAt: "desc" } | { id: "desc" }>;
        skip?: number;
        take: number;
        select: typeof adminNotificationSelect;
      }): Promise<AdminNotificationItem[]>;
      count(args: { where: unknown }): Promise<number>;
      findFirst(args: {
        where: unknown;
        select: {
          id: true;
          readAt: true;
        };
      }): Promise<{ id: string; readAt: Date | null } | null>;
      findUniqueOrThrow(args: {
        where: {
          id: string;
        };
        select: typeof adminNotificationSelect;
      }): Promise<AdminNotificationItem>;
      update(args: {
        where: {
          id: string;
        };
        data: {
          readAt: Date;
        };
        select: typeof adminNotificationSelect;
      }): Promise<AdminNotificationItem>;
      updateMany(args: {
        where: unknown;
        data: {
          readAt?: Date;
          archivedAt?: Date | null;
          archivedReason?: string | null;
        };
      }): Promise<{ count: number }>;
    };
  }
).adminNotification;

const adminNotificationRuleConfig = db.adminNotificationRuleConfig as unknown as {
  findUnique(args: {
    where: {
      scope: string;
    };
    select: {
      id: true;
      rules: true;
    };
  }): Promise<{
    id: string;
    rules: unknown;
  } | null>;
  upsert(args: {
    where: {
      scope: string;
    };
    create: {
      scope: string;
      rules: AdminNotificationRules;
    };
    update: {
      rules: AdminNotificationRules;
    };
    select: {
      rules: true;
    };
  }): Promise<{
    rules: unknown;
  }>;
};

const adminUserWithNotificationPreferences = db.adminUser as unknown as {
  findUnique(args: {
    where: {
      id: string;
    };
    select: {
      id?: true;
      role: true;
      notificationPreferences: true;
    };
  }): Promise<{
    id?: string;
    role: AdminRoleContract;
    notificationPreferences: unknown;
  } | null>;
  update(args: {
    where: {
      id: string;
    };
    data: {
      notificationPreferences: AdminNotificationPreferences;
    };
    select: {
      role: true;
      notificationPreferences: true;
    };
  }): Promise<{
    role: AdminRoleContract;
    notificationPreferences: unknown;
  }>;
};

const adminNotificationScope = "default";

type AttentionCandidate = {
  id: string;
  bookingCode: string;
  contactName: string;
  status: BookingStatus;
  updatedAt: Date;
  squadAssignments: Array<{
    squadId: string;
  }>;
};

function getSeverityRank(severity: AdminNotificationSeverity) {
  if (severity === "critical") {
    return 2;
  }

  if (severity === "warning") {
    return 1;
  }

  return 0;
}

export async function getAdminNotificationRules() {
  const config = await adminNotificationRuleConfig.findUnique({
    where: {
      scope: adminNotificationScope,
    },
    select: {
      id: true,
      rules: true,
    },
  });

  return normalizeAdminNotificationRules(config?.rules);
}

export async function updateAdminNotificationRules(input: AdminNotificationRules) {
  const nextRules = normalizeAdminNotificationRules(input);
  const result = await adminNotificationRuleConfig.upsert({
    where: {
      scope: adminNotificationScope,
    },
    create: {
      scope: adminNotificationScope,
      rules: nextRules,
    },
    update: {
      rules: nextRules,
    },
    select: {
      rules: true,
    },
  });

  return normalizeAdminNotificationRules(result.rules);
}

async function isNotificationTypeEnabled(type: AdminNotificationType) {
  const rules = await getAdminNotificationRules();
  return rules.eventTypeEnabled[type];
}

function formatNotificationDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

function getBookingHref(bookingId: string) {
  return `/admin/bookings?booking=${encodeURIComponent(bookingId)}`;
}

function getRolesWithPermission(permission: "bookings.read") {
  return Object.values(AdminRole).filter((role) => hasPermission(role, permission));
}

async function getOperationalAdminRecipientIds() {
  const recipients = await db.adminUser.findMany({
    where: {
      isActive: true,
      role: {
        in: [AdminRole.SUPER_ADMIN, AdminRole.ADMIN].filter((role) =>
          getRolesWithPermission("bookings.read").includes(role),
        ),
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  return recipients.map<NotificationRecipient>((recipient) => ({
    id: recipient.id,
    role: recipient.role,
    audienceType: "GLOBAL_ADMIN",
    audienceRole: recipient.role,
    recipientReason: "operational_admin",
  }));
}

async function getRelevantSquadRecipientIds(assignedSquadIds: string[]) {
  if (!assignedSquadIds.length) {
    return [];
  }

  const relatedSquads = await db.squad.findMany({
    where: {
      id: {
        in: assignedSquadIds,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!relatedSquads.length) {
    return [];
  }

  const squadEmails = relatedSquads
    .map((squad) => squad.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));
  const squadNames = relatedSquads.map((squad) => squad.name);

  const squadRecipientWhere = {
    isActive: true,
    role: AdminRole.SQUAD,
    OR: [
      {
        squadId: {
          in: relatedSquads.map((squad) => squad.id),
        },
      },
      ...(squadEmails.length
        ? [
            {
              email: {
                in: squadEmails,
              },
            },
          ]
        : []),
      ...(squadNames.length
        ? [
            {
              name: {
                in: squadNames,
              },
            },
          ]
        : []),
    ],
  };

  const recipients = await db.adminUser.findMany({
    where: squadRecipientWhere as never,
    select: {
      id: true,
      role: true,
    },
  });

  return recipients.map<NotificationRecipient>((recipient) => ({
    id: recipient.id,
    role: recipient.role,
    audienceType: "USER_TARGETED",
    audienceRole: recipient.role,
    recipientReason: "related_squad_assignment",
  }));
}

async function buildRecipients(input: {
  includeOperationalAdmins: boolean;
  assignedSquadIds?: string[];
}) {
  const [adminRecipients, squadRecipients] = await Promise.all([
    input.includeOperationalAdmins
      ? getOperationalAdminRecipientIds()
      : Promise.resolve<NotificationRecipient[]>([]),
    input.assignedSquadIds?.length
      ? getRelevantSquadRecipientIds(input.assignedSquadIds)
      : Promise.resolve<NotificationRecipient[]>([]),
  ]);

  return [...adminRecipients, ...squadRecipients].filter((recipient, index, collection) =>
    collection.findIndex((candidate) => candidate.id === recipient.id) === index,
  );
}

function buildNotificationRow(
  recipient: NotificationRecipient,
  input: {
    bookingId: string;
    type: AdminNotificationType;
    severity?: AdminNotificationSeverity;
    title: string;
    message: string;
    detail?: string | null;
    href?: string | null;
    auditMetadata: Omit<NotificationAuditMetadata, "recipientRole" | "recipientReason" | "audienceType">;
  },
) {
  return {
    adminUserId: recipient.id,
    bookingId: input.bookingId,
    type: input.type,
    severity: input.severity ?? "info",
    title: input.title,
    message: input.message,
    detail: input.detail ?? null,
    href: input.href ?? null,
    audienceType: recipient.audienceType,
    audienceRole: recipient.audienceRole,
    auditMetadata: {
      ...input.auditMetadata,
      severity: input.severity ?? "info",
      audienceType: recipient.audienceType,
      recipientRole: recipient.role,
      recipientReason: recipient.recipientReason,
    } satisfies NotificationAuditMetadata,
  };
}

export async function createBookingCreatedAdminNotifications(input: {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  bookingDate: Date;
  timeSlot: string;
  serviceTypeName: string;
}) {
  if (!(await isNotificationTypeEnabled("BOOKING_CREATED"))) {
    return;
  }

  const recipients = await buildRecipients({
    includeOperationalAdmins: true,
  });

  if (!recipients.length) {
    return;
  }

  const detail = `${input.serviceTypeName} scheduled for ${formatNotificationDate(input.bookingDate)} at ${input.timeSlot}`;
  const href = getBookingHref(input.bookingId);

  await adminNotification.createMany({
    data: recipients.map((recipient) =>
      buildNotificationRow(recipient, {
        bookingId: input.bookingId,
        type: "BOOKING_CREATED",
        title: "New booking received",
        message: `Booking ${input.bookingCode} from ${input.customerName} was created`,
        detail,
        href,
        auditMetadata: {
          eventType: "BOOKING_CREATED",
          bookingCode: input.bookingCode,
          customerName: input.customerName,
        },
      }),
    ),
  });
}

export async function createBookingStatusChangedAdminNotifications(input: {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  previousStatus: string;
  nextStatus: string;
  assignedSquadIds?: string[];
}) {
  if (!(await isNotificationTypeEnabled("BOOKING_STATUS_CHANGED"))) {
    return;
  }

  const recipients = await buildRecipients({
    includeOperationalAdmins: true,
    assignedSquadIds: input.assignedSquadIds,
  });

  if (!recipients.length) {
    return;
  }

  const previousLabel = formatStatusLabel(input.previousStatus);
  const nextLabel = formatStatusLabel(input.nextStatus);

  await adminNotification.createMany({
    data: recipients.map((recipient) =>
      buildNotificationRow(recipient, {
        bookingId: input.bookingId,
        type: "BOOKING_STATUS_CHANGED",
        title: "Booking status updated",
        message: `Booking ${input.bookingCode} changed from ${previousLabel} to ${nextLabel}`,
        detail: `${input.customerName} | ${previousLabel} -> ${nextLabel}`,
        href: getBookingHref(input.bookingId),
        auditMetadata: {
          eventType: "BOOKING_STATUS_CHANGED",
          bookingCode: input.bookingCode,
          customerName: input.customerName,
          previousStatus: input.previousStatus,
          nextStatus: input.nextStatus,
          targetSquadIds: input.assignedSquadIds ?? [],
        },
      }),
    ),
  });
}

export async function createBookingSquadsUpdatedAdminNotifications(input: {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  previousSquads: string;
  nextSquads: string;
  relevantSquadIds?: string[];
}) {
  if (!(await isNotificationTypeEnabled("BOOKING_SQUADS_UPDATED"))) {
    return;
  }

  const recipients = await buildRecipients({
    includeOperationalAdmins: true,
    assignedSquadIds: input.relevantSquadIds,
  });

  if (!recipients.length) {
    return;
  }

  const message =
    input.previousSquads === "Unassigned"
      ? `Booking ${input.bookingCode} assigned to ${input.nextSquads}`
      : `Booking ${input.bookingCode} squad assignment updated`;

  await adminNotification.createMany({
    data: recipients.map((recipient) =>
      buildNotificationRow(recipient, {
        bookingId: input.bookingId,
        type: "BOOKING_SQUADS_UPDATED",
        title: "Squad assignment updated",
        message,
        detail: `${input.customerName} | ${input.previousSquads} -> ${input.nextSquads}`,
        href: getBookingHref(input.bookingId),
        auditMetadata: {
          eventType: "BOOKING_SQUADS_UPDATED",
          bookingCode: input.bookingCode,
          customerName: input.customerName,
          previousSquads: input.previousSquads,
          nextSquads: input.nextSquads,
          targetSquadIds: input.relevantSquadIds ?? [],
        },
      }),
    ),
  });
}

function getAttentionRuleForStatus(rules: AdminNotificationRules, status: BookingStatus) {
  if (status === BookingStatus.PENDING) {
    return {
      thresholdHours: rules.sla.pendingHours,
      alertKey: "pending_stale",
      title: "Booking requires attention",
      detailLabel: "Pending too long without confirmation",
    };
  }

  if (status === BookingStatus.CONFIRMED) {
    return {
      thresholdHours: rules.sla.confirmedHours,
      alertKey: "confirmed_stale",
      title: "Booking requires attention",
      detailLabel: "Confirmed too long without squad assignment",
    };
  }

  if (status === BookingStatus.ASSIGNED) {
    return {
      thresholdHours: rules.sla.assignedHours,
      alertKey: "assigned_stale",
      title: "Booking requires attention",
      detailLabel: "Assigned too long without progress",
    };
  }

  if (status === BookingStatus.IN_PROGRESS) {
    return {
      thresholdHours: rules.sla.inProgressHours,
      alertKey: "in_progress_stale",
      title: "Booking requires attention",
      detailLabel: "In progress too long without completion",
    };
  }

  return null;
}

function getAttentionSeverity(overdueHours: number, thresholdHours: number): AdminNotificationSeverity {
  return overdueHours >= thresholdHours * 2 ? "critical" : "warning";
}

async function ensureAdminAttentionNotifications() {
  const rules = await getAdminNotificationRules();

  if (!rules.sla.enabled || !rules.eventTypeEnabled.BOOKING_ATTENTION_REQUIRED) {
    await adminNotification.updateMany({
      where: {
        type: "BOOKING_ATTENTION_REQUIRED",
        archivedAt: null,
      },
      data: {
        archivedAt: new Date(),
        archivedReason: "sla_disabled",
      },
    });
    return;
  }

  const candidateBookings = await db.booking.findMany({
    where: {
      status: {
        in: [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
        ],
      },
    },
    select: {
      id: true,
      bookingCode: true,
      contactName: true,
      status: true,
      updatedAt: true,
      squadAssignments: {
        select: {
          squadId: true,
        },
      },
    },
  });

  const activeAttentionNotifications = await adminNotification.findMany({
    where: {
      type: "BOOKING_ATTENTION_REQUIRED",
      archivedAt: null,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 500,
    select: adminNotificationSelect,
  }) as AdminNotificationItem[];

  const activeByBookingId = new Map<string, AdminNotificationItem[]>();
  activeAttentionNotifications.forEach((notification) => {
    if (!notification.bookingId) {
      return;
    }

    const current = activeByBookingId.get(notification.bookingId) ?? [];
    current.push(notification);
    activeByBookingId.set(notification.bookingId, current);
  });

  const now = Date.now();

  for (const booking of candidateBookings as AttentionCandidate[]) {
    const rule = getAttentionRuleForStatus(rules, booking.status);

    if (!rule) {
      continue;
    }

    const staleHours = (now - booking.updatedAt.getTime()) / (1000 * 60 * 60);
    const existingNotifications = activeByBookingId.get(booking.id) ?? [];

    if (staleHours < rule.thresholdHours) {
      if (existingNotifications.length) {
        await adminNotification.updateMany({
          where: {
            bookingId: booking.id,
            type: "BOOKING_ATTENTION_REQUIRED",
            archivedAt: null,
          },
          data: {
            archivedAt: new Date(),
            archivedReason: "sla_resolved",
          },
        });
      }

      continue;
    }

    const severity = getAttentionSeverity(staleHours, rule.thresholdHours);
    const detail = `${rule.detailLabel} | ${Math.floor(staleHours)}h elapsed`;
    const hasMatchingActiveAlert = existingNotifications.some(
      (notification) =>
        notification.detail === detail
        || getSeverityRank(notification.severity) >= getSeverityRank(severity),
    );

    if (hasMatchingActiveAlert) {
      continue;
    }

    if (existingNotifications.length) {
      await adminNotification.updateMany({
        where: {
          bookingId: booking.id,
          type: "BOOKING_ATTENTION_REQUIRED",
          archivedAt: null,
        },
        data: {
          archivedAt: new Date(),
          archivedReason: "sla_replaced",
        },
      });
    }

    const recipients = await buildRecipients({
      includeOperationalAdmins: true,
      assignedSquadIds: booking.squadAssignments.map((assignment) => assignment.squadId),
    });

    if (!recipients.length) {
      continue;
    }

    await adminNotification.createMany({
      data: recipients.map((recipient) =>
        buildNotificationRow(recipient, {
          bookingId: booking.id,
          type: "BOOKING_ATTENTION_REQUIRED",
          severity,
          title: rule.title,
          message: `Booking ${booking.bookingCode} has remained ${formatStatusLabel(booking.status)} for too long`,
          detail,
          href: getBookingHref(booking.id),
          auditMetadata: {
            eventType: "BOOKING_ATTENTION_REQUIRED",
            alertKey: rule.alertKey,
            staleHours: Math.floor(staleHours),
            bookingCode: booking.bookingCode,
            customerName: booking.contactName,
            nextStatus: booking.status,
            targetSquadIds: booking.squadAssignments.map((assignment) => assignment.squadId),
          },
        }),
      ),
    });
  }
}

export async function getAdminNotifications(input: {
  adminUserId: string;
  page?: number;
  pageSize?: number;
  status?: "read" | "unread";
  view?: "active" | "archived";
}) {
  await ensureAdminAttentionNotifications();

  const currentPage = input.page && input.page > 0 ? input.page : 1;
  const pageSize = input.pageSize && input.pageSize > 0
    ? Math.min(input.pageSize, 50)
    : 20;
  const isArchivedView = input.view === "archived";

  const where = {
    adminUserId: input.adminUserId,
    archivedAt: isArchivedView ? { not: null } : null,
    readAt:
      input.status === "unread"
        ? null
        : input.status === "read"
          ? { not: null }
          : undefined,
  };

  const [items, totalCount, unreadCount] = await Promise.all([
    adminNotification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: adminNotificationSelect,
    }),
    adminNotification.count({ where }),
    adminNotification.count({
      where: {
        adminUserId: input.adminUserId,
        readAt: null,
        archivedAt: null,
      },
    }),
  ]);

  return {
    items,
    totalCount,
    unreadCount,
    page: currentPage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function updateAdminNotificationPreferences(input: {
  adminUserId: string;
  toastEnabled: boolean;
  soundEnabled: boolean;
  typePreferences: Partial<Record<AdminNotificationType, boolean>>;
}) {
  const adminUser = await adminUserWithNotificationPreferences.findUnique({
    where: {
      id: input.adminUserId,
    },
    select: {
      id: true,
      role: true,
      notificationPreferences: true,
    },
  });

  if (!adminUser) {
    throw new Error("ADMIN_USER_NOT_FOUND");
  }

  const availableTypes = getAvailableNotificationTypesForRole(adminUser.role);
  const currentPreferences = normalizeAdminNotificationPreferences(
    adminUser.notificationPreferences,
    adminUser.role,
  );

  const nextPreferences: AdminNotificationPreferences = {
    toastEnabled: input.toastEnabled,
    soundEnabled: input.soundEnabled,
    typePreferences: {
      ...currentPreferences.typePreferences,
      ...input.typePreferences,
    },
  };

  adminNotificationTypes.forEach((type) => {
    if (!availableTypes.includes(type)) {
      nextPreferences.typePreferences[type] = false;
    }
  });

  const updatedUser = await adminUserWithNotificationPreferences.update({
    where: {
      id: input.adminUserId,
    },
    data: {
      notificationPreferences: nextPreferences,
    },
    select: {
      role: true,
      notificationPreferences: true,
    },
  });

  return {
    availableNotificationTypes: getAvailableNotificationTypesForRole(updatedUser.role),
    notificationPreferences: normalizeAdminNotificationPreferences(
      updatedUser.notificationPreferences,
      updatedUser.role,
    ),
  };
}

export async function getAdminNotificationSummary(adminUserId: string) {
  await ensureAdminAttentionNotifications();

  const now = new Date();
  const todayStart = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const [unreadCount, todaysNewBookings, todaysStatusUpdates, todaysSquadUpdates, attentionAlertsOpen, latestItems] =
    await Promise.all([
      adminNotification.count({
        where: {
          adminUserId,
          readAt: null,
          archivedAt: null,
        },
      }),
      adminNotification.count({
        where: {
          adminUserId,
          archivedAt: null,
          type: "BOOKING_CREATED",
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      }),
      adminNotification.count({
        where: {
          adminUserId,
          archivedAt: null,
          type: "BOOKING_STATUS_CHANGED",
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      }),
      adminNotification.count({
        where: {
          adminUserId,
          archivedAt: null,
          type: "BOOKING_SQUADS_UPDATED",
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      }),
      adminNotification.count({
        where: {
          adminUserId,
          archivedAt: null,
          type: "BOOKING_ATTENTION_REQUIRED",
        },
      }),
      adminNotification.findMany({
        where: {
          adminUserId,
          archivedAt: null,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
        select: adminNotificationSelect,
      }),
    ]);

  return {
    unreadCount,
    todaysNewBookings,
    todaysStatusUpdates,
    todaysSquadUpdates,
    attentionAlertsOpen,
    latestItems,
  };
}

export async function getAdminNotificationOverview(adminUserId: string) {
  await ensureAdminAttentionNotifications();

  const rules = await getAdminNotificationRules();
  const now = new Date();
  const todayStart = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const [
    unreadCount,
    notificationsToday,
    newBookingsToday,
    statusUpdatesToday,
    squadUpdatesToday,
    attentionAlertsOpen,
    mostFrequentGroup,
    readItems,
    latestItems,
    weeklyItems,
  ] = await Promise.all([
    adminNotification.count({
      where: {
        adminUserId,
        readAt: null,
        archivedAt: null,
      },
    }),
    adminNotification.count({
      where: {
        adminUserId,
        archivedAt: null,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    adminNotification.count({
      where: {
        adminUserId,
        archivedAt: null,
        type: "BOOKING_CREATED",
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    adminNotification.count({
      where: {
        adminUserId,
        archivedAt: null,
        type: "BOOKING_STATUS_CHANGED",
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    adminNotification.count({
      where: {
        adminUserId,
        archivedAt: null,
        type: "BOOKING_SQUADS_UPDATED",
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    }),
    adminNotification.count({
      where: {
        adminUserId,
        archivedAt: null,
        type: "BOOKING_ATTENTION_REQUIRED",
      },
    }),
    db.adminNotification.groupBy({
      by: ["type"],
      where: {
        adminUserId,
        archivedAt: null,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          type: "desc",
        },
      },
      take: 1,
    }).catch(() => []),
    db.adminNotification.findMany({
      where: {
        adminUserId,
        archivedAt: null,
        readAt: {
          not: null,
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 30,
      select: {
        createdAt: true,
        readAt: true,
      },
    }),
    adminNotification.findMany({
      where: {
        adminUserId,
        archivedAt: null,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 4,
      select: adminNotificationSelect,
    }),
    adminNotification.findMany({
      where: {
        adminUserId,
        archivedAt: null,
        createdAt: {
          gte: weekStart,
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 6,
      select: adminNotificationSelect,
    }),
  ]);

  const averageReadLatencyMinutes = readItems.length
    ? Math.round(
        readItems.reduce((total, item) => {
          if (!item.readAt) {
            return total;
          }

          return total + ((item.readAt.getTime() - item.createdAt.getTime()) / (1000 * 60));
        }, 0) / readItems.length,
      )
    : null;

  return {
    insights: {
      unreadCount,
      notificationsToday,
      newBookingsToday,
      statusUpdatesToday,
      squadUpdatesToday,
      attentionAlertsOpen,
      averageReadLatencyMinutes,
      mostFrequentType: mostFrequentGroup[0]?.type ?? null,
    },
    digest: {
      cadence: rules.digestCadence,
      daily: {
        title: "Daily digest",
        periodLabel: "Today",
        unreadSnapshot: unreadCount,
        newBookings: newBookingsToday,
        statusUpdates: statusUpdatesToday,
        squadUpdates: squadUpdatesToday,
        attentionAlerts: attentionAlertsOpen,
        highlights: latestItems,
      },
      weekly: {
        title: "Weekly snapshot",
        periodLabel: "Last 7 days",
        unreadSnapshot: unreadCount,
        newBookings: weeklyItems.filter((item) => item.type === "BOOKING_CREATED").length,
        statusUpdates: weeklyItems.filter((item) => item.type === "BOOKING_STATUS_CHANGED").length,
        squadUpdates: weeklyItems.filter((item) => item.type === "BOOKING_SQUADS_UPDATED").length,
        attentionAlerts: weeklyItems.filter((item) => item.type === "BOOKING_ATTENTION_REQUIRED").length,
        highlights: weeklyItems.slice(0, 3),
      },
    },
    rules,
  };
}

export async function markAdminNotificationAsRead(input: {
  adminUserId: string;
  notificationId: string;
}) {
  const notification = await adminNotification.findFirst({
    where: {
      id: input.notificationId,
      adminUserId: input.adminUserId,
    },
    select: {
      id: true,
      readAt: true,
    },
  });

  if (!notification) {
    throw new Error("ADMIN_NOTIFICATION_NOT_FOUND");
  }

  if (notification.readAt) {
    return adminNotification.findUniqueOrThrow({
      where: {
        id: input.notificationId,
      },
      select: adminNotificationSelect,
    });
  }

  return adminNotification.update({
    where: {
      id: input.notificationId,
    },
    data: {
      readAt: new Date(),
    },
    select: adminNotificationSelect,
  });
}

export async function markAllAdminNotificationsAsRead(adminUserId: string) {
  const now = new Date();

  const [result, unreadCount] = await Promise.all([
    adminNotification.updateMany({
      where: {
        adminUserId,
        readAt: null,
        archivedAt: null,
      },
      data: {
        readAt: now,
      },
    }),
    adminNotification.count({
      where: {
        adminUserId,
        readAt: null,
        archivedAt: null,
      },
    }),
  ]);

  return {
    updatedCount: result.count,
    unreadCount,
  };
}

export async function bulkMarkAdminNotificationsAsRead(input: {
  adminUserId: string;
  notificationIds: string[];
}) {
  if (!input.notificationIds.length) {
    return markAllAdminNotificationsAsRead(input.adminUserId);
  }

  const now = new Date();

  const [result, unreadCount] = await Promise.all([
    adminNotification.updateMany({
      where: {
        adminUserId: input.adminUserId,
        id: {
          in: input.notificationIds,
        },
        readAt: null,
        archivedAt: null,
      },
      data: {
        readAt: now,
      },
    }),
    adminNotification.count({
      where: {
        adminUserId: input.adminUserId,
        readAt: null,
        archivedAt: null,
      },
    }),
  ]);

  return {
    updatedCount: result.count,
    unreadCount,
  };
}

export async function bulkArchiveAdminNotifications(input: {
  adminUserId: string;
  notificationIds?: string[];
  readOnly?: boolean;
  reason?: string;
}) {
  const now = new Date();
  const where = {
    adminUserId: input.adminUserId,
    archivedAt: null,
    id: input.notificationIds?.length
      ? {
          in: input.notificationIds,
        }
      : undefined,
    readAt: input.readOnly ? { not: null } : undefined,
  };

  const [result, unreadCount] = await Promise.all([
    adminNotification.updateMany({
      where,
      data: {
        archivedAt: now,
        archivedReason: input.reason ?? (input.readOnly ? "archive_read" : "manual_archive"),
      },
    }),
    adminNotification.count({
      where: {
        adminUserId: input.adminUserId,
        readAt: null,
        archivedAt: null,
      },
    }),
  ]);

  return {
    updatedCount: result.count,
    unreadCount,
  };
}

export async function bulkRestoreAdminNotifications(input: {
  adminUserId: string;
  notificationIds: string[];
}) {
  if (!input.notificationIds.length) {
    return {
      updatedCount: 0,
      unreadCount: await adminNotification.count({
        where: {
          adminUserId: input.adminUserId,
          readAt: null,
          archivedAt: null,
        },
      }),
    };
  }

  const [result, unreadCount] = await Promise.all([
    adminNotification.updateMany({
      where: {
        adminUserId: input.adminUserId,
        id: {
          in: input.notificationIds,
        },
        archivedAt: {
          not: null,
        },
      },
      data: {
        archivedAt: null,
        archivedReason: null,
      },
    }),
    adminNotification.count({
      where: {
        adminUserId: input.adminUserId,
        readAt: null,
        archivedAt: null,
      },
    }),
  ]);

  return {
    updatedCount: result.count,
    unreadCount,
  };
}
