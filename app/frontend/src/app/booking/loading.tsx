export default function BookingLoading() {
  return (
    <main className="app-shell">
      <section className="panel p-5 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded-full bg-muted" />
          <div className="h-10 w-3/4 rounded-2xl bg-muted" />
          <div className="h-5 w-full rounded-xl bg-muted/80" />
          <div className="grid gap-3 pt-4 sm:grid-cols-2">
            <div className="h-28 rounded-[1.3rem] bg-muted" />
            <div className="h-28 rounded-[1.3rem] bg-muted" />
            <div className="h-28 rounded-[1.3rem] bg-muted" />
            <div className="h-28 rounded-[1.3rem] bg-muted" />
          </div>
          <div className="h-12 rounded-full bg-muted" />
        </div>
      </section>
    </main>
  );
}
