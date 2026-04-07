export default function AdminLoading() {
  return (
    <main className="admin-shell">
      <div className="grid min-h-screen gap-5 xl:grid-cols-[292px_minmax(0,1fr)] xl:gap-6">
        <section className="hidden xl:block">
          <div className="flex h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[1.9rem] border border-sidebar-border/80 bg-white/95 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.24)]">
            <div className="animate-pulse space-y-4 border-b border-sidebar-border/80 px-5 py-5">
              <div className="h-12 w-40 rounded-[1.1rem] bg-muted/80" />
            </div>
            <div className="animate-pulse space-y-3 px-4 py-5">
              <div className="h-3 w-24 rounded-full bg-muted" />
              <div className="h-12 rounded-[1.1rem] bg-muted/80" />
              <div className="h-12 rounded-[1.1rem] bg-muted/80" />
              <div className="h-12 rounded-[1.1rem] bg-muted/80" />
            </div>
          </div>
        </section>

        <div className="flex min-h-screen flex-col">
          <section className="rounded-[1.3rem] border border-border/80 bg-white/96 px-5 py-4 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.26)]">
            <div className="animate-pulse space-y-3">
              <div className="h-3 w-36 rounded-full bg-muted" />
              <div className="h-7 w-52 rounded-2xl bg-muted" />
              <div className="h-4 w-full max-w-xl rounded-full bg-muted/80" />
            </div>
          </section>

          <section className="mt-3 flex-1 rounded-[1.9rem] border border-border/70 bg-white/88 p-5 shadow-[0_26px_60px_-48px_rgba(15,23,42,0.26)]">
            <div className="animate-pulse space-y-4">
              <div className="h-20 rounded-[1.4rem] bg-muted/70" />
              <div className="h-72 rounded-[1.6rem] bg-muted/70" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
