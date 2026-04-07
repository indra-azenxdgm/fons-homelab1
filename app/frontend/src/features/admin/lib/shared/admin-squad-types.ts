import type { BookingStatus, TimeSlot } from "@/features/booking/constants";

export type AdminSquadDetail = {
  id: string;
  name: string;
  alias: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: {
    bookings: number;
  };
  upcomingAssignments: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: TimeSlot | string;
    status: BookingStatus;
    contactName: string;
    contactPhone: string;
    serviceType: {
      name: string;
    };
  }>;
  pastAssignments: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: TimeSlot | string;
    status: BookingStatus;
    contactName: string;
    contactPhone: string;
    serviceType: {
      name: string;
    };
  }>;
};
