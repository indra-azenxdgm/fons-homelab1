import type { BookingStatus, TimeSlot } from "@/features/booking/constants";

export type AdminCustomerDetail = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  _count: {
    bookings: number;
  };
  bookings: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: TimeSlot | string;
    status: BookingStatus;
    serviceType: {
      name: string;
    };
    assignedSquads: Array<{
      id: string;
      alias: string;
      name: string;
    }>;
  }>;
};
