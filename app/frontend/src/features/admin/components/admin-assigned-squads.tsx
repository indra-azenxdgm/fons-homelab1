import { cn } from "@/lib/utils";

type AssignedSquad = {
  id?: string;
  alias: string;
  name: string;
};

type AdminAssignedSquadsProps = {
  squads: AssignedSquad[];
  variant?: "compact" | "chips" | "inline";
  maxVisible?: number;
  className?: string;
  emptyLabel?: string;
  aliasOnly?: boolean;
  showOverflowSummary?: boolean;
};

function getAssignedSquadLabel(squad: AssignedSquad) {
  return `${squad.alias} · ${squad.name}`;
}

export function AdminAssignedSquads({
  squads,
  variant = "compact",
  maxVisible = 1,
  className,
  emptyLabel = "Unassigned",
  aliasOnly = false,
  showOverflowSummary = true,
}: AdminAssignedSquadsProps) {
  if (!squads.length) {
    return (
      <span className={cn("text-[11px] leading-4 font-medium text-muted-foreground", className)}>
        {emptyLabel}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={className}>
        {squads
          .map((squad) => (aliasOnly ? squad.alias : getAssignedSquadLabel(squad)))
          .join(", ")}
      </span>
    );
  }

  const visibleSquads = squads.slice(0, Math.max(1, maxVisible));
  const overflowCount = Math.max(0, squads.length - visibleSquads.length);
  const chipClassName = aliasOnly
    ? "inline-flex min-w-6 items-center justify-center rounded-full border border-[#C9D9EA] bg-[#F3F8FE] px-1.5 py-0.5 text-[8px] leading-4 font-semibold tracking-[0.02em] text-[#24476B]"
    : "inline-flex rounded-full border border-border/70 bg-muted/45 px-2 py-0.5 text-[8px] leading-4 font-medium text-foreground";
  const overflowChipClassName = aliasOnly
    ? "inline-flex min-w-6 items-center justify-center rounded-full border border-[#D5E1EE] bg-white px-1.5 py-0.5 text-[8px] leading-4 font-semibold tracking-[0.02em] text-muted-foreground"
    : "inline-flex rounded-full border border-border/70 bg-white px-2 py-0.5 text-[8px] leading-4 font-medium text-muted-foreground";

  return (
    <span className={cn("flex min-w-0 max-w-full flex-wrap items-center gap-1.5", aliasOnly && "gap-1", className)}>
      {visibleSquads.map((squad) => (
        <span
          key={squad.id || `${squad.alias}:${squad.name}`}
          className={cn("max-w-full", chipClassName)}
        >
          {aliasOnly ? squad.alias : getAssignedSquadLabel(squad)}
        </span>
      ))}
      {showOverflowSummary && overflowCount > 0 ? (
        <span className={cn("shrink-0", overflowChipClassName)}>
          +{overflowCount}
        </span>
      ) : null}
    </span>
  );
}
