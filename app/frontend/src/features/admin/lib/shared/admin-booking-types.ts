import type { BookingStatus, TimeSlot } from "@/features/booking/constants";

export type SquadOption = {
  id: string;
  name: string;
  alias: string;
  code?: string;
  phone?: string | null;
  email?: string | null;
};

export type ServiceTypeOption = {
  id: string;
  name: string;
};

export type BookingLog = {
  id: string;
  action: string;
  note: string | null;
  createdAt: Date;
  fromStatus: string | null;
  toStatus: string | null;
};

export type AdminBookingDetail = {
  id: string;
  bookingCode: string;
  bookingDate: Date;
  timeSlot: TimeSlot | string;
  status: BookingStatus;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  addressLine1: string;
  addressLine2: string | null;
  district: string | null;
  city: string;
  province: string | null;
  postalCode: string | null;
  notes: string | null;
  serviceDisplayName: string | null;
  serviceVariant: string | null;
  serviceIssue: string | null;
  serviceComplaint: string | null;
  serviceType: {
    name: string;
  };
  customer: {
    fullName: string;
  };
  assignedSquads: SquadOption[];
  createdAt: Date;
  logs: BookingLog[];
};
