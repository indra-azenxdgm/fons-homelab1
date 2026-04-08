import type { AdminNavigationItem } from "@/features/admin/lib/contracts";

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "layout-dashboard",
    permission: "dashboard.read",
    matchMode: "exact",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: "calendar-range",
    permission: "dashboard.read",
    matchMode: "prefix",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: "clipboard-list",
    permission: "bookings.read",
    matchMode: "prefix",
  },
  {
    href: "/admin/finance",
    label: "Finance",
    icon: "wallet",
    permission: "finance.read",
    matchMode: "prefix",
    children: [
      {
        href: "/admin/finance/overview",
        label: "Overview",
        icon: "layout-dashboard",
        permission: "finance.read",
        matchMode: "exact",
      },
      {
        href: "/admin/finance/income",
        label: "Income",
        icon: "arrow-down-circle",
        permission: "finance.read",
        matchMode: "exact",
      },
      {
        href: "/admin/finance/expenses",
        label: "Expenses",
        icon: "arrow-up-circle",
        permission: "finance.read",
        matchMode: "exact",
      },
    ],
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: "users",
    permission: "customers.read",
    matchMode: "prefix",
  },
  {
    href: "/admin/squads",
    label: "Squads",
    icon: "user-round",
    permission: "squads.read",
    matchMode: "prefix",
  },
  {
    href: "/admin/user-roles",
    label: "User & Roles",
    icon: "shield-user",
    permission: "users.manage",
    matchMode: "prefix",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "settings",
    permission: "settings.manage",
    matchMode: "prefix",
    children: [
      {
        href: "/admin/settings/company-profile",
        label: "Company Profile",
        icon: "building-2",
        permission: "settings.manage",
        matchMode: "exact",
      },
      {
        href: "/admin/settings/notifications",
        label: "Notifications",
        icon: "bell",
        permission: "settings.manage",
        matchMode: "exact",
      },
      {
        href: "/admin/settings/danger-zone",
        label: "Danger Zone",
        icon: "shield-alert",
        permission: "settings.manage",
        matchMode: "exact",
      },
    ],
  },
];

export function isAdminNavigationItemActive(
  item: Pick<AdminNavigationItem, "href" | "matchMode" | "children">,
  pathname: string,
) {
  if (item.children?.some((child) => isAdminNavigationItemActive(child, pathname))) {
    return true;
  }

  if (item.matchMode === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getAdminPageContext(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return {
      eyebrow: "Dashboard",
      title: "Dashboard",
      description: "Track operations, bookings, and customer activity from a single internal shell.",
    };
  }

  if (pathname === "/admin/bookings") {
    return {
      eyebrow: "Bookings",
      title: "Bookings",
      description: "Review incoming bookings, filter the queue, and move requests through the workflow.",
    };
  }

  if (pathname.startsWith("/admin/bookings/")) {
    return {
      eyebrow: "Bookings",
      title: "Booking details",
      description: "Inspect booking information, status updates, and audit history for the selected request.",
    };
  }

  if (pathname === "/admin/calendar") {
    return {
      eyebrow: "Calendar",
      title: "Calendar",
      description: "Plan daily operations, booking visibility, and upcoming scheduling workflows from one calendar workspace.",
    };
  }

  if (pathname === "/admin/customers") {
    return {
      eyebrow: "Customers",
      title: "Customers",
      description: "Browse customer profiles and trace booking history linked to each contact.",
    };
  }

  if (pathname === "/admin/finance/income") {
    return {
      eyebrow: "Finance",
      title: "Income",
      description: "Track incoming payments, booking-linked revenue, and manual finance entries from one compact ledger.",
    };
  }

  if (pathname === "/admin/finance/overview") {
    return {
      eyebrow: "Finance",
      title: "Overview",
      description: "Monitor income, expenses, paid bookings, and finance trends in one place.",
    };
  }

  if (pathname === "/admin/finance/expenses") {
    return {
      eyebrow: "Finance",
      title: "Expenses",
      description: "Record operational spending, monitor outgoing cash flow, and keep expense history organized for reporting.",
    };
  }

  if (pathname === "/admin/squads") {
    return {
      eyebrow: "Squads",
      title: "Squads",
      description: "Manage assignable personnel and track booking workloads tied to each squad member.",
    };
  }

  if (pathname.startsWith("/admin/squads/")) {
    return {
      eyebrow: "Squads",
      title: "Squad details",
      description: "Review profile details, upcoming assignments, and booking history for the selected squad member.",
    };
  }

  if (pathname.startsWith("/admin/customers/")) {
    return {
      eyebrow: "Customers",
      title: "Customer details",
      description: "Review customer identity, contact data, and related bookings in one place.",
    };
  }

  if (pathname === "/admin/user-roles") {
    return {
      eyebrow: "User & Roles",
      title: "User & Roles",
      description: "Manage admin accounts and role assignments with a simple three-role access model.",
    };
  }

  if (pathname === "/admin/notifications") {
    return {
      eyebrow: "Notifications",
      title: "Notifications",
      description: "Review booking alerts, assignment updates, and recent operational changes in one inbox.",
    };
  }

  if (pathname === "/admin/settings/notifications") {
    return {
      eyebrow: "Settings",
      title: "Notifications",
      description: "Configure notification alerts, toast behavior, digest cadence, and SLA rules for admin operations.",
    };
  }

  if (pathname === "/admin/settings/company-profile") {
    return {
      eyebrow: "Settings",
      title: "Company Profile",
      description: "Manage company identity details and operational profile settings for the admin workspace.",
    };
  }

  if (pathname === "/admin/settings/danger-zone") {
    return {
      eyebrow: "Settings",
      title: "Danger Zone",
      description: "Preview and wipe operational data while preserving the core configuration required for handover.",
    };
  }

  return {
    eyebrow: "Fon's Admin",
    title: "Dashboard",
    description: "Internal CRM shell for operations, bookings, and customer management.",
  };
}
