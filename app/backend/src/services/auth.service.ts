import {
  changeAdminPasswordWithCurrentPassword,
  authenticateAdminCredentials,
  createAdminSessionToken,
  getAdminUserFromToken,
  revokeAdminSessionToken,
} from "@/features/admin/lib/auth";

export async function loginAdmin(
  email: string,
  password: string,
  context?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const authentication = await authenticateAdminCredentials(email, password);

  if (!authentication.ok) {
    return authentication;
  }

  return {
    ok: true as const,
    token: await createAdminSessionToken(authentication.adminUser.id, context),
    adminUser: authentication.adminUser,
  };
}

export async function getAuthenticatedAdminUser(token: string | null | undefined) {
  return getAdminUserFromToken(token);
}

export async function changeAuthenticatedAdminPassword(
  adminUserId: string,
  currentPassword: string,
  nextPassword: string,
  options?: {
    currentSessionToken?: string | null;
  },
) {
  return changeAdminPasswordWithCurrentPassword(adminUserId, currentPassword, nextPassword, options);
}

export async function logoutAdmin(token: string | null | undefined) {
  await revokeAdminSessionToken(token);
}
