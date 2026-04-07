import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { AdminSquadDetail } from "@/features/admin/lib/shared/admin-squad-types";

export async function getAdminSquadsLookupApi() {
  const response = await fetchAdminApi<{
    squads: Array<{
      id: string;
      name: string;
      alias: string;
      code?: string;
      phone?: string | null;
      email?: string | null;
    }>;
  }>("/api/admin/squads/lookup");

  return response.squads;
}

export async function getAdminSquadsApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: Array<{
      id: string;
      name: string;
      alias: string;
      phone: string | null;
      email: string | null;
      isActive: boolean;
      _count: {
        bookings: number;
      };
      bookings: Array<{
        id: string;
        bookingCode: string;
        bookingDate: Date;
        timeSlot: string;
        contactName: string;
        serviceType: {
          name: string;
        };
      }>;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/api/admin/squads${toQueryString(filters)}`);
}

export async function getAdminSquadDetailApi(squadId: string) {
  const response = await fetchAdminApi<{
    squad: AdminSquadDetail | null;
  }>(`/api/admin/squads/${squadId}`);

  return response.squad;
}
