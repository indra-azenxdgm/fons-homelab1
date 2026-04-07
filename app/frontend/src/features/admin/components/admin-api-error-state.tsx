type AdminApiErrorStateProps = {
  title?: string;
  message: string;
};

export function AdminApiErrorState({
  title = "Data unavailable",
  message,
}: AdminApiErrorStateProps) {
  return (
    <section className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-5 text-destructive shadow-[0_10px_28px_-24px_rgba(127,29,29,0.35)]">
      <h1 className="admin-section-title text-destructive">{title}</h1>
      <p className="mt-2 text-[12px] leading-5 text-destructive/90">{message}</p>
    </section>
  );
}
