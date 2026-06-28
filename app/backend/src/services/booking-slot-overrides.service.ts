import { BookingDayStatus, Prisma, TimeSlot } from "@prisma/client";

import { getTimeSlotLabel } from "@/features/booking/constants";
import { db } from "@/lib/prisma";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type BookingSlotAvailabilityOverride = {
  date: string;
  timeSlot: TimeSlot;
  status: BookingDayStatus;
  reason: string | null;
  message: string | null;
  isManualOverride: boolean;
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
    throw new Error("INVALID_SLOT_OVERRIDE_DATE");
  }
}

function mapStatusMessage(
  status: BookingDayStatus,
  reason: string | null,
  timeSlot: TimeSlot,
) {
  const slotLabel = getTimeSlotLabel(timeSlot);

  if (status === BookingDayStatus.CLOSED) {
    return reason
      ? `Slot ${slotLabel} ditutup untuk booking baru. ${reason}`
      : `Slot ${slotLabel} ditutup untuk booking baru.`;
  }

  if (status === BookingDayStatus.FULL_BOOKED) {
    return reason
      ? `Slot ${slotLabel} sudah penuh untuk booking baru. ${reason}`
      : `Slot ${slotLabel} sudah penuh untuk booking baru.`;
  }

  return null;
}

function mapSlotOverride(
  date: string,
  timeSlot: TimeSlot,
  override?: { status: BookingDayStatus; reason: string | null } | null,
): BookingSlotAvailabilityOverride {
  const status = override?.status ?? BookingDayStatus.OPEN;
  const reason = override?.reason ?? null;

  return {
    date,
    timeSlot,
    status,
    reason,
    message: mapStatusMessage(status, reason, timeSlot),
    isManualOverride: Boolean(override),
  };
}

export async function getBookingSlotOverride(date: string, timeSlot: TimeSlot) {
  assertValidDate(date);

  const override = await db.bookingSlotOverride.findUnique({
    where: {
      date_timeSlot: {
        date: toUtcDateOnly(date),
        timeSlot,
      },
    },
    select: {
      status: true,
      reason: true,
    },
  });

  return mapSlotOverride(date, timeSlot, override);
}

export async function listBookingSlotOverridesForDate(date: string) {
  assertValidDate(date);

  const overrides = await db.bookingSlotOverride.findMany({
    where: {
      date: toUtcDateOnly(date),
    },
    orderBy: {
      timeSlot: "asc",
    },
    select: {
      date: true,
      timeSlot: true,
      status: true,
      reason: true,
    },
  });

  return overrides.map((override) =>
    mapSlotOverride(override.date.toISOString().slice(0, 10), override.timeSlot, override),
  );
}

export async function listBookingSlotOverridesForRange(startDate: Date, endDate: Date) {
  const overrides = await db.bookingSlotOverride.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: [
      { date: "asc" },
      { timeSlot: "asc" },
    ],
    select: {
      date: true,
      timeSlot: true,
      status: true,
      reason: true,
    },
  });

  return overrides.map((override) =>
    mapSlotOverride(override.date.toISOString().slice(0, 10), override.timeSlot, override),
  );
}

export async function getLatestBlockingBookingSlotOverride(
  tx: Prisma.TransactionClient | typeof db,
  date: string,
  timeSlot: TimeSlot,
) {
  assertValidDate(date);

  const override = await tx.bookingSlotOverride.findUnique({
    where: {
      date_timeSlot: {
        date: toUtcDateOnly(date),
        timeSlot,
      },
    },
    select: {
      status: true,
      reason: true,
    },
  });

  if (!override || override.status === BookingDayStatus.OPEN) {
    return null;
  }

  return mapSlotOverride(date, timeSlot, override);
}

export async function setBookingSlotOverride(input: {
  date: string;
  timeSlot: TimeSlot;
  status: BookingDayStatus;
  reason?: string | null;
  actingAdminUserId: string;
}) {
  assertValidDate(input.date);

  const normalizedReason = normalizeReason(input.reason);
  const date = toUtcDateOnly(input.date);
  const where = {
    date_timeSlot: {
      date,
      timeSlot: input.timeSlot,
    },
  };

  if (input.status === BookingDayStatus.OPEN) {
    const existing = await db.bookingSlotOverride.findUnique({
      where,
      select: { id: true, status: true, reason: true },
    });

    if (existing) {
      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.bookingSlotOverride.delete({
          where,
        });

        await tx.adminAuthLog.create({
          data: {
            adminUserId: input.actingAdminUserId,
            event: "booking_slot_override_updated",
            outcome: "success",
            reason: "booking_slot_reopened",
            metadata: {
              date: input.date,
              timeSlot: input.timeSlot,
              previousStatus: existing.status,
              previousReason: existing.reason,
              nextStatus: BookingDayStatus.OPEN,
            },
          },
        });
      });
    }

    return {
      message: "Calendar slot override updated.",
      override: mapSlotOverride(input.date, input.timeSlot, null),
      previousStatus: existing?.status ?? BookingDayStatus.OPEN,
      isStored: false,
    };
  }

  const existing = await db.bookingSlotOverride.findUnique({
    where,
    select: { id: true, status: true, reason: true },
  });

  const override = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const nextRecord = await tx.bookingSlotOverride.upsert({
      where,
      create: {
        date,
        timeSlot: input.timeSlot,
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
        timeSlot: true,
        status: true,
        reason: true,
      },
    });

    await tx.adminAuthLog.create({
      data: {
        adminUserId: input.actingAdminUserId,
        event: "booking_slot_override_updated",
        outcome: "success",
        reason: "booking_slot_status_changed",
        metadata: {
          date: input.date,
          timeSlot: input.timeSlot,
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
    message: "Calendar slot override updated.",
    override: mapSlotOverride(input.date, input.timeSlot, override),
    previousStatus: existing?.status ?? BookingDayStatus.OPEN,
    isStored: true,
  };
}
