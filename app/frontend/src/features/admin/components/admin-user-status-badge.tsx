import { cn } from "@/lib/utils";

type AdminUserStatusBadgeProps = {
  isActive: boolean;
};

export function AdminUserStatusBadge({ isActive }: AdminUserStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[8px] leading-4 font-semibold uppercase tracking-[0.12em]",
        isActive
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-300 bg-slate-50 text-slate-700",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
