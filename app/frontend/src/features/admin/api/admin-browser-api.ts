"use client";

import type { AdminBookingDetail } from "@/features/admin/lib/shared/admin-booking-types";
import { BackendApiError, fetchBackendJson } from "@/lib/api-client";

function getFrontendOrigin() {
  return window.location.origin;
}

export async function loginAdminBrowser(email: string, password: string) {
  return fetchBackendJson<{
    adminUser: {
      id: string;
      email: string;
      name: string;
      role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
      availableNotificationTypes: Array<
        "BOOKING_CREATED" | "BOOKING_STATUS_CHANGED" | "BOOKING_SQUADS_UPDATED" | "BOOKING_ATTENTION_REQUIRED"
      >;
      notificationPreferences: {
        toastEnabled: boolean;
        soundEnabled: boolean;
        typePreferences: Record<
          "BOOKING_CREATED" | "BOOKING_STATUS_CHANGED" | "BOOKING_SQUADS_UPDATED" | "BOOKING_ATTENTION_REQUIRED",
          boolean
        >;
      };
      mustChangePassword: boolean;
    };
  }>("/api/admin/login", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutAdminBrowser() {
  return fetchBackendJson<{ success: true }>("/api/admin/logout", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
  });
}

export async function updateAdminBookingBrowser(
  bookingId: string,
  input: { status: FormDataEntryValue | null; assignedSquadIds: string[] },
) {
  return fetchBackendJson<{ success: true; booking: AdminBookingDetail }>(`/api/admin/bookings/${bookingId}`, {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: input.status,
      assignedSquadIds: input.assignedSquadIds,
    }),
  });
}

export async function createAdminSquadBrowser(input: {
  name: FormDataEntryValue | null;
  phone: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
}) {
  return fetchBackendJson<{ squad: { id: string; name: string; alias: string } }>("/api/admin/squads", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      phone: input.phone,
      email: input.email,
    }),
  });
}

export async function createAdminUserBrowser(input: {
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
  isActive: boolean;
}) {
  return fetchBackendJson<{
    success: true;
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
      isActive: boolean;
      mustChangePassword: boolean;
      isLastActiveSuperAdmin: boolean;
      lastLoginAt: string | null;
      createdAt: string;
    };
    temporaryPassword: string;
  }>("/api/admin/users", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function updateAdminUserRoleBrowser(
  userId: string,
  input: { role: string; isActive: boolean },
) {
  return fetchBackendJson<{
    success: true;
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
      isActive: boolean;
      mustChangePassword: boolean;
      isLastActiveSuperAdmin: boolean;
      lastLoginAt: string | null;
      createdAt: string;
    };
  }>(`/api/admin/users/${userId}`, {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function resetAdminUserPasswordBrowser(userId: string) {
  return fetchBackendJson<{
    success: true;
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
      isActive: boolean;
      mustChangePassword: boolean;
      isLastActiveSuperAdmin: boolean;
      lastLoginAt: string | null;
      createdAt: string;
    };
    temporaryPassword: string;
  }>(`/api/admin/users/${userId}/reset-password`, {
    baseUrl: getFrontendOrigin(),
    method: "POST",
  });
}

export async function deleteAdminUserBrowser(userId: string) {
  return fetchBackendJson<{
    success: true;
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
      isActive: boolean;
      mustChangePassword: boolean;
      isLastActiveSuperAdmin: boolean;
      lastLoginAt: string | null;
      createdAt: string;
    };
  }>(`/api/admin/users/${userId}`, {
    baseUrl: getFrontendOrigin(),
    method: "DELETE",
  });
}

export async function changeAdminPasswordBrowser(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return fetchBackendJson<{ success: true }>("/api/admin/change-password", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export { BackendApiError };
