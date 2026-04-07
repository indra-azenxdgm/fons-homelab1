"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminMoreFilterPanelProps = {
  children: ReactNode;
  open: boolean;
  className?: string;
};

export function AdminMoreFilterPanel({
  children,
  open,
  className,
}: AdminMoreFilterPanelProps) {
  return (
    <div
      className={cn(
        "grid transition-all duration-200 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "rounded-[1rem] border border-border/70 bg-muted/25 p-2.5 sm:rounded-[1.1rem] sm:p-3",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
