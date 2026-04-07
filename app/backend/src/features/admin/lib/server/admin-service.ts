import { AdminRole, BookingStatus, Prisma, TimeSlot } from "@prisma/client";

import {
  ACTIVE_BOOKING_STATUSES,
  TIME_SLOT_OPTIONS,
  TIME_SLOT_VALUES,
  getTimeSlotLabel as getBookingTimeSlotLabel,
} from "@/features/booking/constants";
import {
  generateSquadAlias,
  normalizeSquadName,
} from "@/features/admin/lib/shared/squad-utils";
import {
  generateTemporaryAdminPassword,
  hashAdminPassword,
} from "@/features/admin/lib/password";
import { revokeAdminSessionsForUser } from "@/features/admin/lib/auth";
import { db } from "@/lib/prisma";
import { dispatchNotificationEvent } from "@/features/notifications/lib/notification-service";
import {
  getAdminNotificationSummary,
  createBookingSquadsUpdatedAdminNotifications,
  createBookingStatusChangedAdminNotifications,
} from "@/services/notifications.service";

export const bookingStatusOptions = Object.values(BookingStatus);
type BookingStatusGroup = {
  status: BookingStatus;
  _count: {
    _all: number;
  };
};

type BookingFilters = {
  q?: string;
  date?: string;
  status?: string;
  assignedSquadId?: string;
  serviceTypeId?: string;
  page?: string;
};

type CustomerFilters = {
  q?: string;
  activity?: string;
  page?: string;
};

type SquadFilters = {
  q?: string;
  status?: string;
  page?: string;
};

type AdminUserFilters = {
  q?: string;
  role?: AdminRole | string;
  status?: string;
  page?: string;
};

type CalendarFilters = {
  q?: string;
  month?: string;
  day?: string;
  view?: string;
  status?: string;
  assignedSquadId?: string;
  serviceTypeId?: string;
};

type AssignedSquadSummary = {
  id: string;
  name: string;
  alias: string;
};

const assignedSquadSelection = {
  orderBy: [{ createdAt: "asc" }],
  select: {
    squad: {
      select: {
        id: true,
        name: true,
        alias: true,
      },
    },
  },
} satisfies Prisma.BookingSquadAssignmentFindManyArgs;

const adminBookingLogSelection = {
  orderBy: {
    createdAt: "desc",
  },
  take: 10,
  select: {
    id: true,
    action: true,
    fromStatus: true,
    toStatus: true,
    note: true,
    createdAt: true,
  },
} satisfies Prisma.BookingLogFindManyArgs;

const adminBookingDetailSelection = {
  id: true,
  bookingCode: true,
  bookingDate: true,
  timeSlot: true,
  status: true,
  contactName: true,
  contactPhone: true,
  contactEmail: true,
  addressLine1: true,
  addressLine2: true,
  district: true,
  city: true,
  province: true,
  postalCode: true,
  notes: true,
  internalNotes: true,
  serviceDisplayName: true,
  serviceVariant: true,
  serviceIssue: true,
  serviceComplaint: true,
  serviceTypeId: true,
  createdAt: true,
  updatedAt: true,
  serviceType: {
    select: {
      name: true,
    },
  },
  customer: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    },
  },
  squadAssignments: assignedSquadSelection,
  logs: adminBookingLogSelection,
} satisfies Prisma.BookingSelect;

function mapAssignedSquads<
  T extends {
    squadAssignments: Array<{
      squad: AssignedSquadSummary;
    }>;
  },
>(booking: T) {
  const { squadAssignments, ...rest } = booking;

  return {
    ...rest,
    assignedSquads: squadAssignments.map((assignment) => assignment.squad),
  };
}

function describeAssignedSquads(squads: AssignedSquadSummary[]) {
  if (!squads.length) {
    return "Unassigned";
  }

  return squads.map((squad) => squad.alias).join(", ");
}

function toUtcDateOnly(date: Date) {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function subtractUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() - days);
  return toUtcDateOnly(copy);
}

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return toUtcDateOnly(copy);
}

function formatTrendLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildDailyTrendSeries(
  dates: Date[],
  startDate: Date,
  endDate: Date,
) {
  const counts = new Map<string, number>();

  dates.forEach((date) => {
    const key = toUtcDateOnly(date).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const items: Array<{ date: string; label: string; count: number }> = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const normalized = toUtcDateOnly(cursor);
    const key = normalized.toISOString().slice(0, 10);

    items.push({
      date: key,
      label: formatTrendLabel(normalized),
      count: counts.get(key) || 0,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return items;
}

function toDateFilter(date?: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return undefined;
  }

  return new Date(`${date}T00:00:00.000Z`);
}

function toStatusFilter(status?: string) {
  return bookingStatusOptions.includes(status as BookingStatus)
    ? (status as BookingStatus)
    : undefined;
}

function toSquadActiveFilter(status?: string) {
  if (status === "active") {
    return true;
  }

  if (status === "inactive") {
    return false;
  }

  return undefined;
}

function normalizeOptionalValue(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, " ") || "";
  return normalized || null;
}

function toMonthFilter(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date();

    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const [year, monthIndex] = month.split("-").map(Number);

  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

function toSelectedCalendarDay(day: string | undefined, monthStart: Date) {
  const monthKey = monthStart.toISOString().slice(0, 7);

  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day.startsWith(monthKey)) {
    return new Date(`${day}T00:00:00.000Z`);
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 7);

  if (todayKey === monthKey) {
    return new Date(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
  }

  return monthStart;
}

export function getTimeSlotLabel(slot: string | TimeSlot) {
  return getBookingTimeSlotLabel(String(slot));
}

export function formatAdminDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildBookingHeatmap(
  bookings: Array<{ bookingDate: Date; timeSlot: TimeSlot }>,
  startDate: Date,
  endDate: Date,
) {
  const weekdayKeys = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
  const weekdayLabels = {
    MON: "Mon",
    TUE: "Tue",
    WED: "Wed",
    THU: "Thu",
    FRI: "Fri",
    SAT: "Sat",
    SUN: "Sun",
  } as const;
  const weekdayTotals = new Map<(typeof weekdayKeys)[number], number>(
    weekdayKeys.map((weekday) => [weekday, 0]),
  );
  const slotTotals = new Map<TimeSlot, number>(TIME_SLOT_VALUES.map((slot) => [slot, 0]));
  const matrixCounts = new Map<string, number>();

  function getWeekdayKey(date: Date) {
    const utcDay = date.getUTCDay();
    return weekdayKeys[utcDay === 0 ? 6 : utcDay - 1];
  }

  bookings.forEach((booking) => {
    const weekdayKey = getWeekdayKey(booking.bookingDate);
    const matrixKey = `${booking.timeSlot}:${weekdayKey}`;

    weekdayTotals.set(weekdayKey, (weekdayTotals.get(weekdayKey) || 0) + 1);
    slotTotals.set(booking.timeSlot, (slotTotals.get(booking.timeSlot) || 0) + 1);
    matrixCounts.set(matrixKey, (matrixCounts.get(matrixKey) || 0) + 1);
  });

  const weekdays = weekdayKeys.map((weekday) => ({
    value: weekday,
    label: weekdayLabels[weekday],
    count: weekdayTotals.get(weekday) || 0,
  }));

  const slots = TIME_SLOT_OPTIONS.map((slot) => ({
    value: slot.value,
    label: slot.label,
    count: slotTotals.get(slot.value) || 0,
    cells: weekdayKeys.map((weekday) => ({
      weekday,
      count: matrixCounts.get(`${slot.value}:${weekday}`) || 0,
    })),
  }));

  const maxCellCount = Math.max(
    0,
    ...slots.flatMap((slot) => slot.cells.map((cell) => cell.count)),
  );
  const busiestDay = [...weekdays]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))[0];
  const busiestSlot = [...slots]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))[0];

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    periodLabel: "Last 4 months",
    totalBookings: bookings.length,
    maxCellCount,
    weekdays,
    slots,
    busiestDay: busiestDay?.count ? busiestDay : null,
    busiestSlot: busiestSlot?.count ? busiestSlot : null,
  };
}

export const adminBookingsPageSize = 10;
export const adminCustomersPageSize = 12;
export const adminSquadsPageSize = 12;
export const adminUsersPageSize = 12;

export async function getAdminCalendarMonth(filters: CalendarFilters) {
  const monthStart = toMonthFilter(filters.month);
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(1);
  const startOffset = gridStart.getUTCDay() === 0 ? 6 : gridStart.getUTCDay() - 1;
  gridStart.setUTCDate(gridStart.getUTCDate() - startOffset);
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 42);
  const selectedDate = toSelectedCalendarDay(filters.day, monthStart);
  const query = filters.q?.trim() || undefined;
  const status = toStatusFilter(filters.status);
  const assignedSquadId = filters.assignedSquadId?.trim() || undefined;
  const serviceTypeId = filters.serviceTypeId?.trim() || undefined;

  const [bookings, serviceTypes, squads] = await db.$transaction([
    db.booking.findMany({
      where: {
        bookingDate: {
          gte: gridStart,
          lt: gridEnd,
        },
        squadAssignments: assignedSquadId
          ? {
              some: {
                squadId: assignedSquadId,
              },
            }
          : undefined,
        status: status || undefined,
        serviceTypeId,
        OR: query
          ? [
              { bookingCode: { contains: query, mode: "insensitive" } },
              { contactName: { contains: query, mode: "insensitive" } },
              { contactPhone: { contains: query, mode: "insensitive" } },
              { serviceType: { name: { contains: query, mode: "insensitive" } } },
              { squadAssignments: { some: { squad: { name: { contains: query, mode: "insensitive" } } } } },
              { squadAssignments: { some: { squad: { alias: { contains: query, mode: "insensitive" } } } } },
            ]
          : undefined,
      },
      orderBy: [
        { bookingDate: "asc" },
        { timeSlot: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        status: true,
        contactName: true,
        contactPhone: true,
        serviceTypeId: true,
        serviceDisplayName: true,
        serviceVariant: true,
        serviceIssue: true,
        serviceComplaint: true,
        serviceType: {
          select: {
            name: true,
          },
        },
        squadAssignments: assignedSquadSelection,
      },
    }),
    db.serviceType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    db.squad.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        alias: true,
      },
    }),
  ]);

  return {
    monthStart,
    selectedDate,
    bookings: bookings.map(mapAssignedSquads),
    serviceTypes,
    squads,
    appliedFilters: {
      q: query || "",
      month: monthStart.toISOString().slice(0, 7),
      day: selectedDate.toISOString().slice(0, 10),
      view: filters.view?.trim() || "month",
      status: status || "",
      assignedSquadId: assignedSquadId || "",
      serviceTypeId: serviceTypeId || "",
    },
  };
}

export async function getAdminDashboardOverview(adminUserId: string) {
  const today = toUtcDateOnly(new Date());
  const trendStart = subtractUtcDays(today, 6);
  const activeStatuses: BookingStatus[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.ASSIGNED,
    BookingStatus.IN_PROGRESS,
  ];
  const heatmapStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 3, 1));

  const [
    totalBookings,
    pendingBookings,
    activeBookings,
    totalCustomers,
    statusGroups,
    todaysBookings,
    upcomingBookings,
    recentBookings,
    recentCustomers,
    heatmapBookings,
    bookingTrendBookings,
    customerTrendCustomers,
  ] = await db.$transaction([
    db.booking.count(),
    db.booking.count({
      where: {
        status: BookingStatus.PENDING,
      },
    }),
    db.booking.count({
      where: {
        status: {
          in: activeStatuses,
        },
      },
    }),
    db.customer.count(),
    db.booking.groupBy({
      by: ["status"],
      orderBy: {
        status: "asc",
      },
      _count: {
        _all: true,
      },
    }),
    db.booking.findMany({
      where: {
        bookingDate: today,
      },
      orderBy: [{ timeSlot: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        contactName: true,
        status: true,
        serviceType: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        bookingDate: {
          gte: today,
        },
      },
      orderBy: [{ bookingDate: "asc" }, { timeSlot: "asc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        contactName: true,
        status: true,
        serviceType: {
          select: {
            name: true,
          },
        },
        squadAssignments: assignedSquadSelection,
      },
    }),
    db.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        contactName: true,
        status: true,
        serviceType: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.customer.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
          },
        },
        bookings: {
          orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            bookingDate: true,
            status: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        bookingDate: {
          gte: heatmapStart,
          lte: today,
        },
        status: {
          in: ACTIVE_BOOKING_STATUSES,
        },
        timeSlot: {
          in: TIME_SLOT_VALUES,
        },
      },
      select: {
        bookingDate: true,
        timeSlot: true,
      },
    }),
    db.booking.findMany({
      where: {
        createdAt: {
          gte: trendStart,
          lt: addUtcDays(today, 1),
        },
      },
      select: {
        createdAt: true,
      },
    }),
    db.customer.findMany({
      where: {
        createdAt: {
          gte: trendStart,
          lt: addUtcDays(today, 1),
        },
      },
      select: {
        createdAt: true,
      },
    }),
  ]);
  const notificationSummary = await getAdminNotificationSummary(adminUserId);

  const typedStatusGroups = statusGroups as BookingStatusGroup[];

  const statusCounts = bookingStatusOptions.map((status) => {
    const matchingGroup = typedStatusGroups.find((group) => group.status === status);
    const countAggregate = matchingGroup?._count as { _all?: number } | undefined;

    return {
      status,
      count: countAggregate?._all ?? 0,
    };
  });

  return {
    summary: {
      totalBookings,
      pendingBookings,
      activeBookings,
      totalCustomers,
      bookingTrend: buildDailyTrendSeries(
        bookingTrendBookings.map((item) => item.createdAt),
        trendStart,
        today,
      ),
      customerTrend: buildDailyTrendSeries(
        customerTrendCustomers.map((item) => item.createdAt),
        trendStart,
        today,
      ),
    },
    statusCounts,
    todaysBookings,
    upcomingBookings: upcomingBookings.map(mapAssignedSquads),
    recentBookings,
    recentCustomers,
    heatmap: buildBookingHeatmap(heatmapBookings, heatmapStart, today),
    notificationSummary,
  };
}

export async function getAdminBookings(filters: BookingFilters) {
  const query = filters.q?.trim() || undefined;
  const bookingDate = toDateFilter(filters.date);
  const status = toStatusFilter(filters.status);
  const assignedSquadId = filters.assignedSquadId?.trim() || undefined;
  const serviceTypeId = filters.serviceTypeId?.trim() || undefined;
  const page = Number.parseInt(filters.page || "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const where: Prisma.BookingWhereInput = {
    bookingDate: bookingDate || undefined,
    status: status || undefined,
    squadAssignments: assignedSquadId
      ? {
          some: {
            squadId: assignedSquadId,
          },
        }
      : undefined,
    serviceTypeId,
    OR: query
      ? [
          { bookingCode: { contains: query, mode: "insensitive" } },
          { contactName: { contains: query, mode: "insensitive" } },
          { contactPhone: { contains: query, mode: "insensitive" } },
          { serviceType: { name: { contains: query, mode: "insensitive" } } },
          { squadAssignments: { some: { squad: { name: { contains: query, mode: "insensitive" } } } } },
          { squadAssignments: { some: { squad: { alias: { contains: query, mode: "insensitive" } } } } },
        ]
      : undefined,
  };

  const [items, totalCount] = await db.$transaction([
    db.booking.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { bookingDate: "desc" }, { timeSlot: "desc" }],
      skip: (currentPage - 1) * adminBookingsPageSize,
      take: adminBookingsPageSize,
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        contactName: true,
        contactPhone: true,
        status: true,
        serviceDisplayName: true,
        serviceVariant: true,
        serviceIssue: true,
        serviceComplaint: true,
        serviceType: {
          select: {
            name: true,
          },
        },
        squadAssignments: assignedSquadSelection,
      },
    }),
    db.booking.count({
      where,
    }),
  ]);

  return {
    items: items.map(mapAssignedSquads),
    totalCount,
    page: currentPage,
    pageSize: adminBookingsPageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / adminBookingsPageSize)),
  };
}

export async function getAdminBookingDetail(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: adminBookingDetailSelection,
  });

  return booking ? mapAssignedSquads(booking) : null;
}

export async function getAdminSquads() {
  return db.squad.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      alias: true,
      code: true,
      phone: true,
      email: true,
    },
  });
}

export async function getAdminSquadsList(filters: SquadFilters) {
  const today = toUtcDateOnly(new Date());
  const query = filters.q?.trim() || undefined;
  const isActive = toSquadActiveFilter(filters.status);
  const page = Number.parseInt(filters.page || "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const where: Prisma.SquadWhereInput = {
    isActive,
    OR: query
      ? [
          { name: { contains: query, mode: "insensitive" } },
          { alias: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [items, totalCount] = await db.$transaction([
    db.squad.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (currentPage - 1) * adminSquadsPageSize,
      take: adminSquadsPageSize,
      select: {
        id: true,
        name: true,
        alias: true,
        phone: true,
        email: true,
        isActive: true,
        _count: {
          select: {
            bookingAssignments: true,
          },
        },
        bookingAssignments: {
          where: {
            booking: {
              bookingDate: {
                gte: today,
              },
            },
          },
          orderBy: [
            { booking: { bookingDate: "asc" } },
            { booking: { timeSlot: "asc" } },
            { booking: { createdAt: "asc" } },
          ],
          take: 1,
          select: {
            booking: {
              select: {
                id: true,
                bookingCode: true,
                bookingDate: true,
                timeSlot: true,
                status: true,
                contactName: true,
                serviceType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.squad.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      _count: {
        bookings: item._count.bookingAssignments,
      },
      bookings: item.bookingAssignments.map((assignment) => assignment.booking),
    })),
    totalCount,
    page: currentPage,
    pageSize: adminSquadsPageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / adminSquadsPageSize)),
  };
}

export async function getAdminSquadDetail(squadId: string) {
  const today = toUtcDateOnly(new Date());
  const [squad, upcomingAssignments, pastAssignments] = await db.$transaction([
    db.squad.findUnique({
      where: {
        id: squadId,
      },
      select: {
        id: true,
        name: true,
        alias: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookingAssignments: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        squadAssignments: {
          some: {
            squadId,
          },
        },
        bookingDate: {
          gte: today,
        },
      },
      orderBy: [{ bookingDate: "asc" }, { timeSlot: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        status: true,
        contactName: true,
        contactPhone: true,
        serviceType: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        squadAssignments: {
          some: {
            squadId,
          },
        },
        bookingDate: {
          lt: today,
        },
      },
      orderBy: [{ bookingDate: "desc" }, { timeSlot: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        bookingCode: true,
        bookingDate: true,
        timeSlot: true,
        status: true,
        contactName: true,
        contactPhone: true,
        serviceType: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  if (!squad) {
    return null;
  }

  return {
    ...squad,
    _count: {
      bookings: squad._count.bookingAssignments,
    },
    upcomingAssignments,
    pastAssignments,
  };
}

export async function getAdminServiceTypes() {
  return db.serviceType.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getAdminCustomers(filters: CustomerFilters) {
  const query = filters.q?.trim();
  const activity = filters.activity === "with_bookings" || filters.activity === "without_bookings"
    ? filters.activity
    : undefined;
  const page = Number.parseInt(filters.page || "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const where: Prisma.CustomerWhereInput = {
    OR: query
      ? [
          { fullName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ]
      : undefined,
    bookings:
      activity === "with_bookings"
        ? { some: {} }
        : activity === "without_bookings"
          ? { none: {} }
          : undefined,
  };

  const [items, totalCount] = await db.$transaction([
    db.customer.findMany({
      where,
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      skip: (currentPage - 1) * adminCustomersPageSize,
      take: adminCustomersPageSize,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        _count: {
          select: {
            bookings: true,
          },
        },
        bookings: {
          orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            bookingDate: true,
          },
        },
      },
    }),
    db.customer.count({ where }),
  ]);

  return {
    items,
    totalCount,
    page: currentPage,
    pageSize: adminCustomersPageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / adminCustomersPageSize)),
  };
}

export async function getAdminCustomerDetail(customerId: string) {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          bookings: true,
        },
      },
      bookings: {
        orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
        take: 10,
        select: {
          id: true,
          bookingCode: true,
          bookingDate: true,
          timeSlot: true,
          status: true,
          serviceType: {
            select: {
              name: true,
            },
          },
          squadAssignments: assignedSquadSelection,
        },
      },
    },
  });

  return customer
    ? {
        ...customer,
        bookings: customer.bookings.map(mapAssignedSquads),
      }
    : null;
}

export async function getAdminUsers(filters: AdminUserFilters) {
  const query = filters.q?.trim() || undefined;
  const role = Object.values(AdminRole).includes(filters.role as AdminRole)
    ? filters.role as AdminRole
    : undefined;
  const isActive =
    filters.status === "active" ? true : filters.status === "inactive" ? false : undefined;
  const page = Number.parseInt(filters.page || "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const where: Prisma.AdminUserWhereInput = {
    role,
    isActive,
    OR: query
      ? [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [items, totalCount, activeSuperAdmins] = await db.$transaction([
    db.adminUser.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
      skip: (currentPage - 1) * adminUsersPageSize,
      take: adminUsersPageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    db.adminUser.count({ where }),
    db.adminUser.findMany({
      where: {
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 2,
      select: {
        id: true,
      },
    }),
  ]);

  const lastActiveSuperAdminId = activeSuperAdmins.length === 1
    ? activeSuperAdmins[0].id
    : null;

  return {
    items: items.map((item) => ({
      ...item,
        isLastActiveSuperAdmin:
          item.role === AdminRole.SUPER_ADMIN && item.isActive && item.id === lastActiveSuperAdminId,
    })),
    totalCount,
    page: currentPage,
    pageSize: adminUsersPageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / adminUsersPageSize)),
  };
}

type UpdateAdminBookingInput = {
  bookingId: string;
  status: BookingStatus;
  assignedSquadIds?: string[];
  adminUserId?: string;
};

type UpsertAdminSquadInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
};

async function assertSquadUniqueness(
  tx: Prisma.TransactionClient,
  {
    name,
    alias,
    squadId,
  }: {
    name: string;
    alias: string;
    squadId?: string;
  },
) {
  const normalizedName = normalizeSquadName(name);
  const existing = await tx.squad.findFirst({
    where: {
      OR: [
        { alias },
        { normalizedName },
      ],
      id: squadId
        ? {
            not: squadId,
          }
        : undefined,
    },
    select: {
      id: true,
      name: true,
      alias: true,
      normalizedName: true,
    },
  });

  if (!existing) {
    return {
      normalizedName,
    };
  }

  if (existing.alias === alias) {
    throw new Error("SQUAD_ALIAS_CONFLICT");
  }

  throw new Error("SQUAD_DUPLICATE_NAME");
}

async function getLastActiveSuperAdminId(tx: Prisma.TransactionClient) {
  const activeSuperAdmins = await tx.adminUser.findMany({
    where: {
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 2,
    select: {
      id: true,
    },
  });

  return activeSuperAdmins.length === 1 ? activeSuperAdmins[0].id : null;
}

export async function createAdminSquad(input: UpsertAdminSquadInput) {
  const name = normalizeSquadName(input.name);
  const alias = generateSquadAlias(name);
  const phone = normalizeOptionalValue(input.phone);
  const email = normalizeOptionalValue(input.email)?.toLowerCase() || null;

  if (!name) {
    throw new Error("SQUAD_NAME_REQUIRED");
  }

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const { normalizedName } = await assertSquadUniqueness(tx, { name, alias });

    return tx.squad.create({
      data: {
        name,
        normalizedName,
        alias,
        code: alias,
        phone,
        email,
        isActive: input.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        alias: true,
        phone: true,
        email: true,
        isActive: true,
      },
    });
  });
}

export async function updateAdminSquad(
  squadId: string,
  input: UpsertAdminSquadInput,
) {
  const name = normalizeSquadName(input.name);
  const alias = generateSquadAlias(name);
  const phone = normalizeOptionalValue(input.phone);
  const email = normalizeOptionalValue(input.email)?.toLowerCase() || null;

  if (!name) {
    throw new Error("SQUAD_NAME_REQUIRED");
  }

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.squad.findUnique({
      where: {
        id: squadId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new Error("SQUAD_NOT_FOUND");
    }

    const { normalizedName } = await assertSquadUniqueness(tx, {
      name,
      alias,
      squadId,
    });

    return tx.squad.update({
      where: {
        id: squadId,
      },
      data: {
        name,
        normalizedName,
        alias,
        code: alias,
        phone,
        email,
        isActive: input.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        alias: true,
        phone: true,
        email: true,
        isActive: true,
      },
    });
  });
}

export async function updateAdminBooking({
  bookingId,
  status,
  assignedSquadIds = [],
  adminUserId,
}: UpdateAdminBookingInput) {
  const dedupedAssignedSquadIds = [...new Set(
    assignedSquadIds
      .map((squadId) => squadId.trim())
      .filter(Boolean),
  )];

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        squadAssignments: assignedSquadSelection,
        bookingCode: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        bookingDate: true,
        timeSlot: true,
        serviceType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    const existingAssignedSquads = existing.squadAssignments.map((assignment) => assignment.squad);
    let nextAssignedSquads: AssignedSquadSummary[] = [];

    if (dedupedAssignedSquadIds.length) {
      const squads = await tx.squad.findMany({
        where: {
          id: {
            in: dedupedAssignedSquadIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          alias: true,
          name: true,
        },
      });

      if (squads.length !== dedupedAssignedSquadIds.length) {
        throw new Error("SQUAD_NOT_FOUND");
      }

      const squadMap = new Map(squads.map((squad) => [squad.id, squad]));
      nextAssignedSquads = dedupedAssignedSquadIds.map((squadId) => {
        const squad = squadMap.get(squadId);

        if (!squad) {
          throw new Error("SQUAD_NOT_FOUND");
        }

        return squad;
      });
    }

    const previousAssignmentSummary = describeAssignedSquads(existingAssignedSquads);
    const nextAssignmentSummary = describeAssignedSquads(nextAssignedSquads);
    const assignmentsChanged =
      previousAssignmentSummary !== nextAssignmentSummary;

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status,
        squadAssignments: {
          deleteMany: {},
          create: dedupedAssignedSquadIds.map((squadId) => ({
            squadId,
          })),
        },
        logs: {
          create: {
            adminUserId,
            action: "admin_booking_updated",
            fromStatus: existing.status,
            toStatus: status,
            note:
              assignmentsChanged
                ? `Assigned squads changed from ${previousAssignmentSummary} to ${nextAssignmentSummary}`
                : existing.status !== status
                  ? "Booking status updated from admin dashboard"
                : "Booking status updated from admin dashboard",
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: adminBookingDetailSelection,
    });

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    return {
      booking: mapAssignedSquads(booking),
      previousStatus: existing.status,
      assignmentsChanged,
      previousAssignmentSummary,
      nextAssignmentSummary,
      previousAssignedSquadIds: existingAssignedSquads.map((squad) => squad.id),
      nextAssignedSquadIds: nextAssignedSquads.map((squad) => squad.id),
    };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });

  if (result.previousStatus !== result.booking.status) {
    await createBookingStatusChangedAdminNotifications({
      bookingId: result.booking.id,
      bookingCode: result.booking.bookingCode,
      customerName: result.booking.contactName,
      previousStatus: result.previousStatus,
      nextStatus: result.booking.status,
      assignedSquadIds: result.nextAssignedSquadIds,
    });

    if (result.booking.status === BookingStatus.CONFIRMED) {
      await dispatchNotificationEvent({
        eventType: "booking.confirmed",
        payload: {
          bookingId: result.booking.id,
          bookingCode: result.booking.bookingCode,
          customerName: result.booking.contactName,
          phone: result.booking.contactPhone,
          email: result.booking.contactEmail,
          bookingDate: result.booking.bookingDate,
          timeSlot: String(result.booking.timeSlot),
          serviceTypeName: result.booking.serviceType.name,
        },
      });
    }

    if (result.booking.status === BookingStatus.CANCELLED) {
      await dispatchNotificationEvent({
        eventType: "booking.canceled",
        payload: {
          bookingId: result.booking.id,
          bookingCode: result.booking.bookingCode,
          customerName: result.booking.contactName,
          phone: result.booking.contactPhone,
          email: result.booking.contactEmail,
          bookingDate: result.booking.bookingDate,
          timeSlot: String(result.booking.timeSlot),
          serviceTypeName: result.booking.serviceType.name,
        },
      });
    }
  }

  if (result.assignmentsChanged) {
    await createBookingSquadsUpdatedAdminNotifications({
      bookingId: result.booking.id,
      bookingCode: result.booking.bookingCode,
      customerName: result.booking.contactName,
      previousSquads: result.previousAssignmentSummary,
      nextSquads: result.nextAssignmentSummary,
      relevantSquadIds: [...new Set([
        ...result.previousAssignedSquadIds,
        ...result.nextAssignedSquadIds,
      ])],
    });
  }

  return result.booking;
}

export async function updateAdminUserRole(
  userId: string,
  nextRole: AdminRole,
  nextIsActive: boolean,
  actingAdminUserId: string,
) {
  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.adminUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new Error("ADMIN_USER_NOT_FOUND");
    }

    const hasRoleChanged = existing.role !== nextRole;
    const hasStatusChanged = existing.isActive !== nextIsActive;

    if (!hasRoleChanged && !hasStatusChanged) {
      const lastActiveSuperAdminId = await getLastActiveSuperAdminId(tx);

      return {
        ...existing,
        isLastActiveSuperAdmin:
          existing.role === AdminRole.SUPER_ADMIN
          && existing.isActive
          && existing.id === lastActiveSuperAdminId,
        shouldRevokeSessions: false,
      };
    }

    if (existing.id === actingAdminUserId) {
      throw new Error("SELF_ACCESS_CHANGE_NOT_ALLOWED");
    }

    if (existing.role === AdminRole.SUPER_ADMIN && existing.isActive) {
      const isRemovingActiveSuperAdmin =
        nextRole !== AdminRole.SUPER_ADMIN || !nextIsActive;

      if (isRemovingActiveSuperAdmin) {
        const lastActiveSuperAdminId = await getLastActiveSuperAdminId(tx);

        if (lastActiveSuperAdminId === existing.id) {
          throw new Error("LAST_SUPER_ADMIN");
        }
      }
    }

    const updatedUser = await tx.adminUser.update({
      where: {
        id: userId,
      },
      data: {
        role: nextRole,
        isActive: nextIsActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await tx.adminAuthLog.create({
      data: {
        adminUserId: actingAdminUserId,
        event: "admin_user_access_updated",
        outcome: "succeeded",
        reason:
          hasRoleChanged && hasStatusChanged
            ? "role_and_status_changed"
            : hasRoleChanged
              ? "role_changed"
              : "status_changed",
        identifier: updatedUser.email,
        metadata: {
          targetUserId: updatedUser.id,
          targetEmail: updatedUser.email,
          previousRole: existing.role,
          nextRole,
          previousIsActive: existing.isActive,
          nextIsActive,
        },
      },
    });

    const lastActiveSuperAdminId = await getLastActiveSuperAdminId(tx);

    return {
      ...updatedUser,
      isLastActiveSuperAdmin:
        updatedUser.role === AdminRole.SUPER_ADMIN
        && updatedUser.isActive
        && updatedUser.id === lastActiveSuperAdminId,
      shouldRevokeSessions: hasRoleChanged || !nextIsActive,
    };
  });

  if (result.shouldRevokeSessions) {
    await revokeAdminSessionsForUser(result.id);
  }

  const { shouldRevokeSessions: _shouldRevokeSessions, ...user } = result;
  return user;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  actingAdminUserId: string;
}) {
  const name = normalizeOptionalValue(input.name)?.replace(/\s+/g, " ") || "";
  const email = input.email.trim().toLowerCase();

  const temporaryPassword = generateTemporaryAdminPassword();
  const passwordHash = await hashAdminPassword(temporaryPassword);

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.adminUser.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new Error("ADMIN_USER_EMAIL_CONFLICT");
    }

    const user = await tx.adminUser.create({
      data: {
        name,
        email,
        role: input.role,
        isActive: input.isActive,
        passwordHash,
        mustChangePassword: true,
        invitedAt: new Date(),
        passwordUpdatedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await tx.adminAuthLog.create({
      data: {
        adminUserId: input.actingAdminUserId,
        event: "admin_user_created",
        outcome: "succeeded",
        reason: "temporary_password_issued",
        identifier: user.email,
        metadata: {
          targetUserId: user.id,
          targetEmail: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });

    return {
      user: {
        ...user,
        isLastActiveSuperAdmin: false,
      },
      temporaryPassword,
    };
  });
}

export async function resetAdminUserPassword(
  userId: string,
  actingAdminUserId: string,
) {
  const temporaryPassword = generateTemporaryAdminPassword();
  const passwordHash = await hashAdminPassword(temporaryPassword);

  const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.adminUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new Error("ADMIN_USER_NOT_FOUND");
    }

    if (existing.id === actingAdminUserId) {
      throw new Error("PASSWORD_RESET_SELF_NOT_ALLOWED");
    }

    const updatedUser = await tx.adminUser.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordUpdatedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await tx.adminAuthLog.create({
      data: {
        adminUserId: actingAdminUserId,
        event: "admin_user_password_reset",
        outcome: "succeeded",
        reason: "temporary_password_issued",
        identifier: updatedUser.email,
        metadata: {
          targetUserId: updatedUser.id,
          targetEmail: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      },
    });

    const lastActiveSuperAdminId = await getLastActiveSuperAdminId(tx);

    return {
      user: {
        ...updatedUser,
        isLastActiveSuperAdmin:
          updatedUser.role === AdminRole.SUPER_ADMIN
          && updatedUser.isActive
          && updatedUser.id === lastActiveSuperAdminId,
      },
      temporaryPassword,
    };
  });

  await revokeAdminSessionsForUser(result.user.id);
  return result;
}

export async function deleteAdminUser(
  userId: string,
  actingAdminUserId: string,
) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.adminUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new Error("ADMIN_USER_NOT_FOUND");
    }

    if (existing.id === actingAdminUserId) {
      throw new Error("USER_DELETE_SELF_NOT_ALLOWED");
    }

    if (existing.role === AdminRole.SUPER_ADMIN && existing.isActive) {
      const lastActiveSuperAdminId = await getLastActiveSuperAdminId(tx);

      if (lastActiveSuperAdminId === existing.id) {
        throw new Error("LAST_SUPER_ADMIN_DELETE_NOT_ALLOWED");
      }
    }

    await tx.adminUser.delete({
      where: {
        id: existing.id,
      },
    });

    await tx.adminAuthLog.create({
      data: {
        adminUserId: actingAdminUserId,
        event: "admin_user_deleted",
        outcome: "succeeded",
        reason: "account_deleted",
        identifier: existing.email,
        metadata: {
          targetUserId: existing.id,
          targetEmail: existing.email,
          role: existing.role,
          isActive: existing.isActive,
        },
      },
    });

    return {
      ...existing,
      isLastActiveSuperAdmin: false,
    };
  });
}
