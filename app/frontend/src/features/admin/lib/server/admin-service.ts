import "server-only";

import { getAdminBookingDetailApi, getAdminBookingsApi } from "@/features/admin/api/bookings-api";
import { getAdminCalendarMonthApi, getAdminServiceTypesApi } from "@/features/admin/api/calendar-api";
import { getAdminCustomerDetailApi, getAdminCustomersApi } from "@/features/admin/api/customers-api";
import { getAdminDashboardOverviewApi } from "@/features/admin/api/dashboard-api";
import { getAdminExpensesApi, getAdminFinanceBookingsApi, getAdminFinanceOverviewApi, getAdminIncomeApi } from "@/features/admin/api/finance-api";
import { getAdminCompanyProfileApi } from "@/features/admin/api/company-profile-api";
import { getAdminSquadDetailApi, getAdminSquadsApi, getAdminSquadsLookupApi } from "@/features/admin/api/squads-api";
import { getAdminUsersApi } from "@/features/admin/api/users-api";
import {
  BOOKING_STATUS_VALUES,
  getTimeSlotLabel as getBookingTimeSlotLabel,
} from "@/features/booking/constants";

export const bookingStatusOptions = [...BOOKING_STATUS_VALUES];

export function getTimeSlotLabel(slot: string) {
  return getBookingTimeSlotLabel(slot);
}

export function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export async function getAdminDashboardOverview() {
  return getAdminDashboardOverviewApi();
}

export async function getAdminBookings(filters: Record<string, string | undefined>) {
  const response = await getAdminBookingsApi(filters);
  return response;
}

export async function getAdminBookingDetail(bookingId: string) {
  const response = await getAdminBookingDetailApi(bookingId);
  return response.booking;
}

export async function getAdminBookingDetailPageData(bookingId: string) {
  return getAdminBookingDetailApi(bookingId);
}

export async function getAdminSquads() {
  return getAdminSquadsLookupApi();
}

export async function getAdminServiceTypes() {
  return getAdminServiceTypesApi();
}

export async function getAdminCalendarMonth(filters: Record<string, string | undefined>) {
  return getAdminCalendarMonthApi(filters);
}

export async function getAdminCustomers(filters: Record<string, string | undefined>) {
  return getAdminCustomersApi(filters);
}

export async function getAdminCustomerDetail(customerId: string) {
  return getAdminCustomerDetailApi(customerId);
}

export async function getAdminSquadsList(filters: Record<string, string | undefined>) {
  return getAdminSquadsApi(filters);
}

export async function getAdminSquadDetail(squadId: string) {
  return getAdminSquadDetailApi(squadId);
}

export async function getAdminUsers(filters: Record<string, string | undefined>) {
  return getAdminUsersApi(filters);
}

export async function getAdminFinanceBookingLookup(filters: Record<string, string | undefined>) {
  return getAdminFinanceBookingsApi(filters);
}

export async function getAdminFinanceOverview(period?: "7D" | "30D" | "3M" | "12M") {
  return getAdminFinanceOverviewApi({ period });
}

export async function getAdminCompanyProfile() {
  return getAdminCompanyProfileApi();
}

export async function getAdminIncome(filters: Record<string, string | undefined>) {
  return getAdminIncomeApi(filters);
}

export async function getAdminExpenses(filters: Record<string, string | undefined>) {
  return getAdminExpensesApi(filters);
}
