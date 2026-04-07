import "server-only";

import { fetchAdminApi } from "@/features/admin/api/admin-api";
import type { BookingStatus, TimeSlot } from "@/features/booking/constants";

export type AdminOverview = {
  summary: {
    totalBookings: number;
    pendingBookings: number;
    activeBookings: number;
    totalCustomers: number;
    bookingTrend: Array<{
      date: string;
      label: string;
      count: number;
    }>;
    customerTrend: Array<{
      date: string;
      label: string;
      count: number;
    }>;
  };
  statusCounts: Array<{
    status: BookingStatus;
    count: number;
  }>;
  todaysBookings: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: TimeSlot;
    contactName: string;
    status: BookingStatus;
    serviceType: {
      name: string;
    };
  }>;
  upcomingBookings: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: TimeSlot;
    contactName: string;
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
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: TimeSlot;
    contactName: string;
    status: BookingStatus;
    serviceType: {
      name: string;
    };
  }>;
  recentCustomers: Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    _count: {
      bookings: number;
    };
    bookings: Array<{
      bookingDate: Date;
      status: BookingStatus;
    }>;
  }>;
  heatmap: {
    startDate: string;
    endDate: string;
    periodLabel: string;
    totalBookings: number;
    maxCellCount: number;
    weekdays: Array<{
      value: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
      label: string;
      count: number;
    }>;
    slots: Array<{
      value: TimeSlot;
      label: string;
      count: number;
      cells: Array<{
        weekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        count: number;
      }>;
    }>;
    busiestDay: {
      value: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
      label: string;
      count: number;
    } | null;
    busiestSlot: {
      value: TimeSlot;
      label: string;
      count: number;
    } | null;
  };
  notificationSummary: {
    unreadCount: number;
    todaysNewBookings: number;
    todaysStatusUpdates: number;
    todaysSquadUpdates: number;
    attentionAlertsOpen: number;
    latestItems: Array<{
      id: string;
      type: "BOOKING_CREATED" | "BOOKING_STATUS_CHANGED" | "BOOKING_SQUADS_UPDATED" | "BOOKING_ATTENTION_REQUIRED";
      severity: "info" | "warning" | "critical";
      title: string;
      message: string;
      detail: string | null;
      href: string | null;
      readAt: Date | null;
      createdAt: Date;
      bookingId: string | null;
    }>;
  };
};

export async function getAdminDashboardOverviewApi() {
  return fetchAdminApi<AdminOverview>("/api/admin/dashboard");
}
