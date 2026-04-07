"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type PopoutPosition = {
  top: number;
  left: number;
};

type AdminSidebarPopoutProps = {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function AdminSidebarPopout({
  open,
  triggerRef,
  onClose,
  children,
  className,
}: AdminSidebarPopoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<PopoutPosition | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPosition(null);
    }
  }, [open]);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;

      if (!trigger || !panel) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const viewportPadding = 12;
      const nextPosition = {
        top: Math.max(
          viewportPadding,
          Math.min(triggerRect.top - 4, window.innerHeight - panelRect.height - viewportPadding),
        ),
        left: Math.max(
          viewportPadding,
          Math.min(triggerRect.right + 10, window.innerWidth - panelRect.width - viewportPadding),
        ),
      };

      setPosition((current) => {
        if (
          current &&
          current.top === nextPosition.top &&
          current.left === nextPosition.left
        ) {
          return current;
        }

        return nextPosition;
      });
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updatePosition();
          })
        : null;

    if (resizeObserver && panelRef.current) {
      resizeObserver.observe(panelRef.current);
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        onClose();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, triggerRef]);

  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[80] rounded-[1rem] border border-border/80 bg-white shadow-[0_22px_34px_-24px_rgba(0,81,162,0.18)]",
        !position && "pointer-events-none opacity-0",
        className,
      )}
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
