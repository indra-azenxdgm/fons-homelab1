import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="panel p-6 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
          Access restricted
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          You do not have access to this admin page
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your account is signed in, but it does not currently have permission to open
          this section.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Back to admin home
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Open bookings
          </Link>
        </div>
      </div>
    </section>
  );
}
