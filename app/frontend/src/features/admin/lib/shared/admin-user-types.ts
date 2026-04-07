export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
  isActive: boolean;
  mustChangePassword: boolean;
  isLastActiveSuperAdmin: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
};
