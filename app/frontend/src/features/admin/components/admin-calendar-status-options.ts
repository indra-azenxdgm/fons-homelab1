import type { BookingDayStatus } from "@/features/booking/constants";

export const calendarDayStatusOptions: Array<{ value: BookingDayStatus; label: string; helper: string }> = [
  {
    value: "OPEN",
    label: "Reopen Date",
    helper: "Return the selected date to normal slot-based booking capacity.",
  },
  {
    value: "FULL_BOOKED",
    label: "Set Full Booking",
    helper: "Block all new public bookings because this date is fully booked operationally.",
  },
  {
    value: "CLOSED",
    label: "Set Closed / Holiday",
    helper: "Block all new public bookings because this date is closed or unavailable.",
  },
];

export const calendarSlotStatusOptions: Array<{ value: BookingDayStatus; label: string; helper: string }> = [
  {
    value: "OPEN",
    label: "Reopen Slot",
    helper: "Return this slot to normal booking capacity for the selected date.",
  },
  {
    value: "FULL_BOOKED",
    label: "Set Full Booking",
    helper: "Block new public bookings because this slot is fully booked operationally.",
  },
  {
    value: "CLOSED",
    label: "Set Closed / Holiday",
    helper: "Block new public bookings because this slot is closed or unavailable.",
  },
];

export function getCalendarStatusLabel(status: BookingDayStatus) {
  if (status === "CLOSED") {
    return "Closed";
  }

  if (status === "FULL_BOOKED") {
    return "Full Booking";
  }

  return "Open";
}

export function getCalendarSlotStatusLabel(status: BookingDayStatus) {
  if (status === "CLOSED") {
    return "Manual closed";
  }

  if (status === "FULL_BOOKED") {
    return "Manual full";
  }

  return "Normal";
}
