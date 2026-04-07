import { BookingStatus } from "@prisma/client";

export const TIME_SLOT_OPTIONS = [
  { value: "SLOT_0900", label: "09:00" },
  { value: "SLOT_1100", label: "11:00" },
  { value: "SLOT_1300", label: "13:00" },
  { value: "SLOT_1500", label: "15:00" },
] as const;

export const TIME_SLOT_VALUES = TIME_SLOT_OPTIONS.map((slot) => slot.value) as [
  "SLOT_0900",
  "SLOT_1100",
  "SLOT_1300",
  "SLOT_1500",
];

export function getTimeSlotLabel(slot?: string | null) {
  return TIME_SLOT_OPTIONS.find((item) => item.value === slot)?.label || slot || "";
}

export const MAX_BOOKINGS_PER_SLOT = 3;

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.ASSIGNED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.PAID,
];

export const DUPLICATE_GUARD_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.ASSIGNED,
  BookingStatus.IN_PROGRESS,
];
