import Link from "next/link";

type AdminTableOpenLinkProps = {
  href: string;
  children?: React.ReactNode;
  scroll?: boolean;
};

export const adminTableActionsHeaderClassName = "px-3 py-2 text-center text-[11px] leading-4 font-medium";
export const adminTableActionsCellClassName = "px-3 py-2 text-center";
export const adminTableOpenLinkClassName =
  "inline-flex h-8 min-w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] leading-4 font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200";
export const adminTableIconButtonBaseClassName =
  "inline-flex size-8 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2";
export const adminTableEditIconButtonClassName =
  `${adminTableIconButtonBaseClassName} hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:ring-sky-200`;
export const adminTableDeleteIconButtonClassName =
  `${adminTableIconButtonBaseClassName} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-200`;

export function AdminTableOpenLink({
  href,
  children = "Open",
  scroll,
}: AdminTableOpenLinkProps) {
  return (
    <Link href={href} scroll={scroll} className={adminTableOpenLinkClassName}>
      {children}
    </Link>
  );
}
