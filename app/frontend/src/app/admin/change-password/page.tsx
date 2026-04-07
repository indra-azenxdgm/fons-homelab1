import { redirect } from "next/navigation";

import { AdminChangePasswordForm } from "@/features/admin/components/admin-change-password-form";
import { getCurrentAdminUser } from "@/features/admin/lib/auth";

export default async function AdminChangePasswordPage() {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  if (!adminUser.mustChangePassword) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6 sm:px-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
            Password update required
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Change your password</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Your account is using a temporary password. Set a new password before continuing to the admin workspace.
          </p>
        </div>
        <AdminChangePasswordForm />
      </section>
    </main>
  );
}
