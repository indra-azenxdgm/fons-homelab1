"use client";

import Link from "next/link";
import { ChevronDown, FileDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminFinanceExportMenuProps = {
  exportPath: string;
};

export function AdminFinanceExportMenu({ exportPath }: AdminFinanceExportMenuProps) {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!containerRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("pointerdown", onPointerDown);
    }

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const buildHref = (format: "xlsx" | "csv" | "pdf") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", format);
    return `${exportPath}?${params.toString()}`;
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="h-8 rounded-[0.95rem] px-2.5 text-[11px] leading-4 sm:px-3"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FileDown className="size-3.5" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} />
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.35rem)] z-20 w-44 rounded-[1rem] border border-border/80 bg-white p-1.5 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.2)]">
          <Link href={buildHref("xlsx")} className="flex h-8 items-center rounded-[0.75rem] px-2.5 text-[11px] font-medium text-foreground transition hover:bg-muted/55" onClick={() => setOpen(false)}>
            XLSX
          </Link>
          <Link href={buildHref("csv")} className="flex h-8 items-center rounded-[0.75rem] px-2.5 text-[11px] font-medium text-foreground transition hover:bg-muted/55" onClick={() => setOpen(false)}>
            CSV
          </Link>
          <Link href={buildHref("pdf")} className="flex h-8 items-center rounded-[0.75rem] px-2.5 text-[11px] font-medium text-foreground transition hover:bg-muted/55" onClick={() => setOpen(false)}>
            PDF
          </Link>
        </div>
      ) : null}
    </div>
  );
}
