"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  Building2,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  ShieldUser,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  isAdminNavigationItemActive,
} from "@/features/admin/lib/navigation";
import type {
  AdminNavigationIcon,
  AdminNavigationItem,
} from "@/features/admin/lib/contracts";

const iconMap: Record<AdminNavigationIcon, ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  "clipboard-list": ClipboardList,
  "calendar-range": CalendarRange,
  wallet: Wallet,
  "arrow-down-circle": ArrowDownCircle,
  "arrow-up-circle": ArrowUpCircle,
  "building-2": Building2,
  bell: Bell,
  users: Users,
  "user-round": UserRound,
  "shield-user": ShieldUser,
  "shield-alert": ShieldAlert,
  settings: Settings,
};

type AdminSidebarNavigationProps = {
  items: AdminNavigationItem[];
  compact?: boolean;
  onNavigate?: () => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

const compactNavButtonClassName =
  "group flex size-8.5 shrink-0 items-center justify-center rounded-[0.8rem] border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const desktopNavItemClassName =
  "admin-sidebar-item group flex min-h-10 w-full items-center gap-2.5 rounded-[0.8rem] border px-2.5 py-1.5 text-[11px] font-medium leading-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const desktopNavIconClassName =
  "flex size-7 shrink-0 items-center justify-center rounded-[0.72rem] border transition";

const desktopSubmenuClassName = "ml-3 space-y-0.5 border-l border-sidebar-border/75 pl-3";

const desktopSubmenuItemClassName =
  "admin-sidebar-subitem flex min-h-[2.125rem] items-center gap-2.25 rounded-[0.72rem] px-[0.6875rem] py-1.5 text-[11px] font-medium leading-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const compactSubmenuItemClassName =
  "admin-sidebar-subitem flex min-h-[2.125rem] items-center gap-2.5 rounded-[0.75rem] px-3 py-2 text-[11px] font-medium leading-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const submenuIconClassName =
  "flex size-6 shrink-0 items-center justify-center rounded-[0.68rem] border border-sidebar-border/75 bg-white/88 text-muted-foreground transition";

function getActiveExpandableHref(items: AdminNavigationItem[], pathname: string) {
  return items.find((item) => item.children?.length && isAdminNavigationItemActive(item, pathname))?.href ?? null;
}

function getPanelPosition(trigger: HTMLElement, panelWidth: number) {
  const rect = trigger.getBoundingClientRect();
  const viewportPadding = 12;

  return {
    top: Math.max(viewportPadding, Math.min(rect.top, window.innerHeight - 220)),
    left: Math.max(
      viewportPadding,
      Math.min(rect.right + 8, window.innerWidth - panelWidth - viewportPadding),
    ),
  };
}

export function AdminSidebarNavigation({
  items,
  compact = false,
  onNavigate,
}: AdminSidebarNavigationProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [openMenuHref, setOpenMenuHref] = useState<string | null>(null);
  const [expandedDesktopHref, setExpandedDesktopHref] = useState<string | null>(() => getActiveExpandableHref(items, pathname));
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setExpandedDesktopHref(getActiveExpandableHref(items, pathname));
  }, [items, pathname]);

  useEffect(() => {
    if (!openMenuHref) {
      return;
    }

    const openMenuKey = openMenuHref;

    function updateMenuPosition() {
      const trigger = triggerRefs.current[openMenuKey];

      if (!trigger) {
        return;
      }

      const panelWidth = panelRef.current?.offsetWidth ?? 208;
      setMenuPosition(getPanelPosition(trigger, panelWidth));
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [openMenuHref]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !panelRef.current?.contains(target) &&
        !Object.values(triggerRefs.current).some((element) => element?.contains(target))
      ) {
        setOpenMenuHref(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuHref(null);
      }
    }

    if (openMenuHref) {
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenuHref]);

  const activeMenuItem = openMenuHref
    ? items.find((item) => item.href === openMenuHref && item.children?.length)
    : null;

  if (compact) {
    return (
      <>
        <nav
          aria-label="Admin navigation"
          className="flex flex-col items-center gap-1"
        >
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = isAdminNavigationItemActive(item, pathname);
            const isOpen = openMenuHref === item.href;

            if (item.children?.length) {
              return (
                <button
                  key={item.href}
                  ref={(element) => {
                    triggerRefs.current[item.href] = element;
                  }}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                  onClick={() => setOpenMenuHref((current) => (current === item.href ? null : item.href))}
                  className={cn(
                    compactNavButtonClassName,
                    isActive
                      ? "border-primary/35 bg-primary/[0.08] text-primary shadow-[0_8px_16px_-18px_rgba(0,81,162,0.24)]"
                      : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-white hover:text-foreground",
                  )}
                >
                  <Icon className="size-[15px]" />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
                onClick={onNavigate}
                className={cn(
                  compactNavButtonClassName,
                  isActive
                    ? "border-primary/35 bg-primary/[0.08] text-primary shadow-[0_8px_16px_-18px_rgba(0,81,162,0.24)]"
                    : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-white hover:text-foreground",
                )}
              >
                <Icon className="size-[15px]" />
              </Link>
            );
          })}
        </nav>

        {isMounted && activeMenuItem?.children?.length && menuPosition
          ? createPortal(
              <div
                ref={panelRef}
                className="fixed z-[80] w-52 rounded-[0.95rem] border border-border/80 bg-white p-1.5 shadow-[0_18px_30px_-22px_rgba(0,81,162,0.16)]"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                }}
              >
                {activeMenuItem.children.map((child) => {
                  const ChildIcon = iconMap[child.icon];
                  const isChildActive = isAdminNavigationItemActive(child, pathname);

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={isChildActive ? "page" : undefined}
                      onClick={() => {
                        setOpenMenuHref(null);
                        onNavigate?.();
                      }}
                      className={cn(
                        compactSubmenuItemClassName,
                        isChildActive
                          ? "bg-primary/[0.07] text-foreground"
                          : "text-foreground/82 hover:bg-muted/55",
                      )}
                    >
                      <span
                        className={cn(
                          submenuIconClassName,
                          isChildActive
                            ? "border-primary/16 bg-white text-primary"
                            : "group-hover:border-[color:var(--border-strong)] group-hover:text-foreground",
                        )}
                      >
                        <ChildIcon className="size-[13px]" />
                      </span>
                      <span className="truncate">{child.label}</span>
                    </Link>
                  );
                })}
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }

  return (
    <>
      <nav aria-label="Admin navigation" className="space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = isAdminNavigationItemActive(item, pathname);
          const isExpanded = expandedDesktopHref === item.href;

          if (item.children?.length) {
            return (
              <div key={item.href} className="space-y-1">
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedDesktopHref((current) =>
                      current === item.href ? null : item.href,
                    )
                  }
                  className={cn(
                    desktopNavItemClassName,
                    isActive
                      ? "border border-primary/18 bg-primary/[0.07] text-foreground shadow-[0_8px_16px_-20px_rgba(0,81,162,0.22)]"
                      : "border border-transparent text-sidebar-foreground/74 hover:border-border/70 hover:bg-white/92 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      desktopNavIconClassName,
                      isActive
                        ? "border-primary/16 bg-white text-primary"
                        : "border-sidebar-border/80 bg-white/92 text-muted-foreground group-hover:border-[color:var(--border-strong)] group-hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[14px]" />
                  </span>
                  <span className="truncate">{item.label}</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto size-3.5 shrink-0 text-muted-foreground transition",
                      isExpanded && "rotate-90",
                    )}
                  />
                </button>

                {isExpanded ? (
                  <div className={desktopSubmenuClassName}>
                    {item.children.map((child) => {
                      const ChildIcon = iconMap[child.icon];
                      const isChildActive = isAdminNavigationItemActive(child, pathname);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={isChildActive ? "page" : undefined}
                          onClick={onNavigate}
                          className={cn(
                            desktopSubmenuItemClassName,
                            isChildActive
                              ? "bg-primary/[0.07] text-foreground"
                              : "text-sidebar-foreground/72 hover:bg-white/72 hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              submenuIconClassName,
                              isChildActive
                                ? "border-primary/16 bg-white text-primary"
                                : "group-hover:border-[color:var(--border-strong)] group-hover:text-foreground",
                            )}
                          >
                            <ChildIcon className="size-[13px]" />
                          </span>
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                desktopNavItemClassName,
                isActive
                  ? "border border-primary/18 bg-primary/[0.07] text-foreground shadow-[0_8px_16px_-20px_rgba(0,81,162,0.22)]"
                  : "border border-transparent text-sidebar-foreground/74 hover:border-border/70 hover:bg-white/92 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  desktopNavIconClassName,
                  isActive
                    ? "border-primary/16 bg-white text-primary"
                    : "border-sidebar-border/80 bg-white/92 text-muted-foreground group-hover:border-[color:var(--border-strong)] group-hover:text-foreground",
                )}
              >
                <Icon className="size-[14px]" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
