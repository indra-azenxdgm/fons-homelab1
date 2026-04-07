import type { AdminNavigationItem } from "@/features/admin/lib/contracts";
import { AdminSidebarNavigation } from "@/features/admin/components/admin-sidebar-navigation";

type AdminNavigationProps = {
  items: AdminNavigationItem[];
  compact?: boolean;
  onNavigate?: () => void;
};

export function AdminNavigation({
  items,
  compact = false,
  onNavigate,
}: AdminNavigationProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <AdminSidebarNavigation
          items={items}
          compact={compact}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
