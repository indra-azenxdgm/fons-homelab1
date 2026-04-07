import { BookingStatus, Prisma, TimeSlot } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { db } from "@/lib/prisma";

import {
  ACTIVE_BOOKING_STATUSES,
  DUPLICATE_GUARD_BOOKING_STATUSES,
  MAX_BOOKINGS_PER_SLOT,
  TIME_SLOT_OPTIONS,
  getTimeSlotLabel,
} from "@/features/booking/constants";
import {
  type BookingFormValues,
  type ParsedBookingFormValues,
} from "@/features/booking/lib/booking-schema";
import {
  getPublicServiceDisplayName,
  resolveStructuredBookingService,
} from "@/features/booking/lib/public-service-config";
import {
  BookingSecurityError,
  isDuplicateSubmissionError,
  logBookingSecurityEvent,
} from "@/features/booking/lib/booking-security";
import { createBookingCreatedAdminNotifications } from "@/services/notifications.service";
import { dispatchNotificationEvent } from "@/features/notifications/lib/notification-service";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class BookingCapacityError extends Error {
  constructor(message = "Slot ini baru saja penuh. Silakan pilih jam lain.") {
    super(message);
    this.name = "BookingCapacityError";
  }
}

export class BookingDuplicateActiveError extends Error {
  constructor(
    message = "Sudah ada booking aktif untuk nomor HP, tanggal, dan jam ini. Jika perlu ubah jadwal, silakan pilih slot lain atau tunggu konfirmasi tim kami.",
  ) {
    super(message);
    this.name = "BookingDuplicateActiveError";
  }
}

export class BookingValidationError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>, message = "Silakan lengkapi dan periksa kembali data booking Anda.") {
    super(message);
    this.name = "BookingValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function getDefaultBookingDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function toBookingDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function parseCity(address: string) {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.at(-1) || "Yogyakarta";
}

async function getBookedCountForSlot(
  tx: Prisma.TransactionClient | typeof db,
  bookingDate: string,
  timeSlot: BookingFormValues["timeSlot"],
) {
  return tx.booking.count({
    where: {
      bookingDate: toBookingDate(bookingDate),
      timeSlot: timeSlot as unknown as TimeSlot,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
  });
}

async function assertSlotHasCapacity(
  tx: Prisma.TransactionClient | typeof db,
  bookingDate: string,
  timeSlot: BookingFormValues["timeSlot"],
) {
  const booked = await getBookedCountForSlot(tx, bookingDate, timeSlot);

  if (booked >= MAX_BOOKINGS_PER_SLOT) {
    throw new BookingCapacityError();
  }

  return {
    booked,
    remainingCapacity: Math.max(MAX_BOOKINGS_PER_SLOT - booked, 0),
  };
}

async function findDuplicateActiveBooking(
  tx: Prisma.TransactionClient | typeof db,
  values: ParsedBookingFormValues,
) {
  return tx.booking.findFirst({
    where: {
      contactPhone: values.phone,
      bookingDate: toBookingDate(values.bookingDate),
      timeSlot: values.timeSlot as unknown as TimeSlot,
      status: { in: DUPLICATE_GUARD_BOOKING_STATUSES },
    },
    select: {
      id: true,
      bookingCode: true,
      status: true,
    },
  });
}

async function acquireSlotLock(
  tx: Prisma.TransactionClient,
  bookingDate: string,
  timeSlot: BookingFormValues["timeSlot"],
) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${bookingDate}), hashtext(${timeSlot}))
  `;
}

export async function getAvailableSlots(bookingDate: string) {
  if (!DATE_PATTERN.test(bookingDate)) {
    return TIME_SLOT_OPTIONS.map((slot) => ({
      ...slot,
      available: false,
      remainingCapacity: 0,
    }));
  }

  const bookings = await db.booking.groupBy({
    by: ["timeSlot"],
    where: {
      bookingDate: toBookingDate(bookingDate),
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
    _count: {
      _all: true,
    },
  });

  const counts = new Map<string, number>(
    bookings.map((item) => [String(item.timeSlot), item._count._all]),
  );

  return TIME_SLOT_OPTIONS.map((slot) => {
    const booked = counts.get(slot.value) || 0;
    const remainingCapacity = Math.max(MAX_BOOKINGS_PER_SLOT - booked, 0);

    return {
      ...slot,
      available: remainingCapacity > 0,
      remainingCapacity,
    };
  });
}

async function findOrCreateCustomer(
  tx: Prisma.TransactionClient,
  values: ParsedBookingFormValues,
) {
  const normalizedEmail = values.email || null;
  const normalizedPhone = values.phone;

  const customer = await tx.customer.findUnique({
    where: { phone: normalizedPhone },
  });

  const emailOwner =
    normalizedEmail && (!customer || customer.email !== normalizedEmail)
      ? await tx.customer.findUnique({
          where: { email: normalizedEmail },
        })
      : null;

  if (customer) {
    return tx.customer.update({
      where: { id: customer.id },
      data: {
        fullName: values.name,
        phone: normalizedPhone,
        email: emailOwner ? customer.email : normalizedEmail,
        notes: values.notes || null,
      },
    });
  }

  return tx.customer.create({
    data: {
      fullName: values.name,
      phone: normalizedPhone,
      email: emailOwner ? null : normalizedEmail,
      notes: values.notes || null,
    },
  });
}

async function generateBookingCode(tx: Prisma.TransactionClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `FON-${suffix}`;
    const existing = await tx.booking.findUnique({
      where: { bookingCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Tidak dapat membuat kode booking yang unik");
}

const bookingNotificationSelect = {
  id: true,
  bookingCode: true,
  contactName: true,
  contactPhone: true,
  contactEmail: true,
  bookingDate: true,
  timeSlot: true,
  serviceDisplayName: true,
  serviceVariant: true,
  serviceIssue: true,
  serviceComplaint: true,
  serviceType: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.BookingSelect;

export type BookingCreateResult = {
  booking: Prisma.BookingGetPayload<{
    select: typeof bookingNotificationSelect;
  }>;
  wasCreated: boolean;
};

export async function getBookingBySubmissionKey(submissionKey: string) {
  return db.booking.findUnique({
    where: {
      clientSubmissionId: submissionKey,
    },
    select: bookingNotificationSelect,
  });
}

export async function createBooking(
  values: ParsedBookingFormValues,
): Promise<BookingCreateResult> {
  // Fast-fail against obviously full slots, but the authoritative check happens
  // again inside the locked transaction below.
  const availableSlots = await getAvailableSlots(values.bookingDate);
  const selectedSlot = availableSlots.find((slot) => slot.value === values.timeSlot);

  if (!selectedSlot?.available) {
    throw new BookingCapacityError();
  }

  const existingBySubmission = await getBookingBySubmissionKey(values.submissionKey);

  if (existingBySubmission) {
    return {
      booking: existingBySubmission,
      wasCreated: false,
    };
  }

  try {
    const booking = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.booking.findUnique({
        where: {
          clientSubmissionId: values.submissionKey,
        },
        select: bookingNotificationSelect,
      });

      if (existing) {
        return {
          booking: existing,
          wasCreated: false,
        };
      }

      await acquireSlotLock(tx, values.bookingDate, values.timeSlot);

      const duplicateActiveBooking = await findDuplicateActiveBooking(tx, values);

      if (duplicateActiveBooking) {
        throw new BookingDuplicateActiveError();
      }

      await assertSlotHasCapacity(tx, values.bookingDate, values.timeSlot);

      const serviceType = await tx.serviceType.findFirst({
        where: {
          id: values.serviceTypeId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      if (!serviceType) {
        throw new BookingValidationError({
          serviceTypeId: ["Layanan yang dipilih tidak tersedia."],
        });
      }

      const resolvedService = resolveStructuredBookingService(serviceType, values);

      if (Object.keys(resolvedService.fieldErrors).length) {
        throw new BookingValidationError(resolvedService.fieldErrors);
      }

      const [customer, bookingCode] = await Promise.all([
        findOrCreateCustomer(tx, values),
        generateBookingCode(tx),
      ]);

      const createdBooking = await tx.booking.create({
        data: {
          bookingCode,
          clientSubmissionId: values.submissionKey,
          customerId: customer.id,
          serviceTypeId: values.serviceTypeId,
          bookingDate: toBookingDate(values.bookingDate),
          timeSlot: values.timeSlot as unknown as TimeSlot,
          status: BookingStatus.PENDING,
          contactName: values.name,
          contactPhone: values.phone,
          contactEmail: values.email || null,
          serviceDisplayName: resolvedService.details.displayName,
          serviceVariant: resolvedService.details.serviceVariant,
          serviceIssue: resolvedService.details.repairIssue,
          serviceComplaint: resolvedService.details.serviceComplaint,
          addressLine1: values.address,
          mapsUrl: values.mapsUrl || null,
          latitude: values.latitude ?? null,
          longitude: values.longitude ?? null,
          city: parseCity(values.address),
          notes: values.notes || null,
          logs: {
            create: {
              action: "booking_created",
              toStatus: BookingStatus.PENDING,
              note: "Pemesanan dikirim dari form publik",
            },
          },
        },
        select: bookingNotificationSelect,
      });

      return {
        booking: createdBooking,
        wasCreated: true,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    if (booking.wasCreated) {
      await createBookingCreatedAdminNotifications({
        bookingId: booking.booking.id,
        bookingCode: booking.booking.bookingCode,
        customerName: booking.booking.contactName,
        bookingDate: booking.booking.bookingDate,
        timeSlot: getTimeSlotLabel(String(booking.booking.timeSlot)),
        serviceTypeName: booking.booking.serviceDisplayName || booking.booking.serviceType.name,
      });

      await dispatchNotificationEvent({
        eventType: "booking.created",
        payload: {
          bookingId: booking.booking.id,
          bookingCode: booking.booking.bookingCode,
          customerName: booking.booking.contactName,
          phone: booking.booking.contactPhone,
          email: booking.booking.contactEmail,
          bookingDate: booking.booking.bookingDate,
          timeSlot: getTimeSlotLabel(String(booking.booking.timeSlot)),
          serviceTypeName: booking.booking.serviceDisplayName || booking.booking.serviceType.name,
        },
      });
    }

    return booking;
  } catch (error) {
    if (isDuplicateSubmissionError(error)) {
      const booking = await getBookingBySubmissionKey(values.submissionKey);

      if (booking) {
        await logBookingSecurityEvent({
          outcome: "rejected",
          reason: "duplicate_submission",
          phone: values.phone,
          submissionKey: values.submissionKey,
          payload: {
            bookingDate: values.bookingDate,
            timeSlot: values.timeSlot,
          },
        });

        return {
          booking,
          wasCreated: false,
        };
      }
    }

    if (error instanceof BookingDuplicateActiveError) {
      throw error;
    }

    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BookingSecurityError("Pemesanan belum bisa dikirim saat ini.", 400);
    }

    throw error;
  }
}

export async function getServiceTypes() {
  return db.serviceType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      estimatedDuration: true,
    },
  });
}

export async function getBookingByCode(bookingCode: string) {
  return db.booking.findUnique({
    where: { bookingCode },
    select: {
      bookingCode: true,
      contactName: true,
      bookingDate: true,
      timeSlot: true,
      serviceDisplayName: true,
      serviceVariant: true,
      serviceIssue: true,
      serviceComplaint: true,
      serviceType: {
        select: {
          name: true,
        },
      },
    },
  });
}
