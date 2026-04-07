import { cn } from "@/lib/utils";

type AdminUserPasswordBadgeProps = {
  mustChangePassword: boolean;
};

export function AdminUserPasswordBadge({ mustChangePassword }: AdminUserPasswordBadgeProps) {
  if (!mustChangePassword) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[8px] leading-4 font-semibold uppercase tracking-[0.12em] text-amber-900",
      )}
    >
      Password change required
    </span>
  );
}
