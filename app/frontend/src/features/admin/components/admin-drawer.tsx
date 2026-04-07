"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
  className?: string;
};

function cleanupAdminDrawerSideEffects() {
  if (typeof document === "undefined") {
    return;
  }

  if (
    document.querySelector("[data-admin-drawer-popup]") ||
    document.querySelector("[data-admin-drawer-backdrop]") ||
    document.querySelector("[data-base-ui-inert]")
  ) {
    return;
  }

  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("pointer-events");
  document.body.style.removeProperty("padding-right");
  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("pointer-events");
}

export function AdminDrawer({
  open,
  onOpenChange,
  onOpenChangeComplete,
  title,
  description,
  headerContent,
  children,
  className,
}: AdminDrawerProps) {
  useEffect(() => {
    if (open) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      cleanupAdminDrawerSideEffects();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => () => {
    cleanupAdminDrawerSideEffects();
  }, []);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          cleanupAdminDrawerSideEffects();
        }

        onOpenChangeComplete?.(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          data-admin-drawer-backdrop=""
          className="fixed inset-0 z-50 bg-slate-950/22 transition data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        />
        <Dialog.Popup
          data-admin-drawer-popup=""
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[30rem] flex-col border-l border-border bg-white shadow-[-20px_0_40px_-32px_rgba(0,81,162,0.18)] outline-none transition duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full sm:max-w-[32rem]",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-3 sm:px-6">
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <Dialog.Title className="admin-drawer-title">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="admin-drawer-subtitle mt-1">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              {headerContent ? <div className="shrink-0">{headerContent}</div> : null}
            </div>

            <Dialog.Close
              aria-label="Close drawer"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-[0.95rem] border border-border bg-white text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
