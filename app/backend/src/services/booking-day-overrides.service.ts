import { BookingDayStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type BookingDayAvailability = {
  date: string;
  status: BookingDayStatus;
  reason: string | null;
  message: string | null;
};

function toUtcDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function normalizeReason(reason?: string | null) {
  const normalized = reason?.trim().replace(/\s+/g, " ") || "";
  return normalized || null;
}

function assertValidDate(date: string) {
  if (!DATE_PATTERN.test(date)) {
    throw new Error("INVALID_OVERRIDE_DATE");
  }
}

function mapStatusMessage(status: BookingDayStatus, reason: string | null) {
  if (status === BookingDayStatus.CLOSED) {
    return reason
      ? `Tanggal ini ditutup untuk booking baru. ${reason}`
      : "Tanggal ini ditutup untuk booking baru karena hari libur atau operasional tutup.";
  }

  if (status === BookingDayStatus.FULL_BOOKED) {
    return reason
      ? `Tanggal ini sudah penuh untuk booking baru. ${reason}`
      : "Tanggal ini sudah penuh untuk booking baru.";
  }

  return null;
}

function mapAvailability(date: string, override?: { status: BookingDayStatus; reason: string | null } | null): BookingDayAvailability {
  const status = override?.status ?? BookingDayStatus.OPEN;
  const reason = override?.reason ?? null;

  return {
    date,
    status,
    reason,
    message: mapStatusMessage(status, reason),
  };
}

export async function getBookingDayAvailability(date: string): Promise<BookingDayAvailability> {
  assertValidDate(date);

  const override = await db.bookingDayOverride.findUnique({
    where: {
      date: toUtcDateOnly(date),
    },
    select: {
      status: true,
      reason: true,
    },
  });

  return mapAvailability(date, override);
}

export async function getBookingDayOverride(date: string) {
  return getBookingDayAvailability(date);
}

export async function listBookingDayOverridesForRange(startDate: Date, endDate: Date) {
  const overrides = await db.bookingDayOverride.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      status: true,
      reason: true,
    },
  });

  return overrides.map((override) =>
    mapAvailability(override.date.toISOString().slice(0, 10), override),
  );
}

export async function setBookingDayOverride(input: {
  date: string;
  status: BookingDayStatus;
  reason?: string | null;
  actingAdminUserId: string;
}) {
  assertValidDate(input.date);

  const normalizedReason = normalizeReason(input.reason);
  const date = toUtcDateOnly(input.date);

  if (input.status === BookingDayStatus.OPEN) {
    const existing = await db.bookingDayOverride.findUnique({
      where: { date },
      select: { id: true, status: true, reason: true },
    });

    if (existing) {
      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.bookingDayOverride.delete({
          where: { date },
        });

        await tx.adminAuthLog.create({
          data: {
            adminUserId: input.actingAdminUserId,
            event: "booking_day_override_updated",
            outcome: "success",
            reason: "booking_day_reopened",
            metadata: {
              date: input.date,
              previousStatus: existing.status,
              previousReason: existing.reason,
              nextStatus: BookingDayStatus.OPEN,
            },
          },
        });
      });
    }

    return {
      override: mapAvailability(input.date, null),
      previousStatus: existing?.status ?? BookingDayStatus.OPEN,
    };
  }

  const existing = await db.bookingDayOverride.findUnique({
    where: { date },
    select: { id: true, status: true, reason: true },
  });

  const override = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const nextRecord = await tx.bookingDayOverride.upsert({
      where: { date },
      create: {
        date,
        status: input.status,
        reason: normalizedReason,
        createdByAdminUserId: input.actingAdminUserId,
        updatedByAdminUserId: input.actingAdminUserId,
      },
      update: {
        status: input.status,
        reason: normalizedReason,
        updatedByAdminUserId: input.actingAdminUserId,
      },
      select: {
        date: true,
        status: true,
        reason: true,
      },
    });

    await tx.adminAuthLog.create({
      data: {
        adminUserId: input.actingAdminUserId,
        event: "booking_day_override_updated",
        outcome: "success",
        reason: "booking_day_status_changed",
        metadata: {
          date: input.date,
          previousStatus: existing?.status ?? BookingDayStatus.OPEN,
          previousReason: existing?.reason ?? null,
          nextStatus: nextRecord.status,
          nextReason: nextRecord.reason,
        },
      },
    });

    return nextRecord;
  });

  return {
    override: mapAvailability(input.date, override),
    previousStatus: existing?.status ?? BookingDayStatus.OPEN,
  };
}
