import {
  createAdminSquad,
  getAdminSquadDetail,
  getAdminSquads,
  getAdminSquadsList,
} from "@/features/admin/lib/server/admin-service";

export async function listSquads(filters: Record<string, string | undefined>) {
  return getAdminSquadsList(filters);
}

export async function getSquadLookup() {
  return getAdminSquads();
}

export async function getSquadDetail(squadId: string) {
  return getAdminSquadDetail(squadId);
}

export async function createSquad(input: {
  name: string;
  phone?: string | null;
  email?: string | null;
}) {
  return createAdminSquad(input);
}
