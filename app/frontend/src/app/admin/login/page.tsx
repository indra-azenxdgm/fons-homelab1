export const dynamic = "force-dynamic";

import Image from "next/image";
import { redirect } from "next/navigation";

import { AdminLoginBackground } from "@/features/admin/components/admin-login-background";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { getCurrentAdminUser } from "@/features/admin/lib/auth";

export default async function AdminLoginPage() {
  let adminUser = null;

  try {
    adminUser = await getCurrentAdminUser();
  } catch (error) {
    console.error("[admin/login] failed to check existing session", error);
  }

  if (adminUser) {
    redirect(adminUser.mustChangePassword ? "/admin/change-password" : "/admin/dashboard");
  }
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-transparent">
      <AdminLoginBackground />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6 sm:px-6">
        <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_30px_72px_-34px_rgba(0,81,162,0.3)] backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="flex justify-center">
                <Image
                  src="/fons-header.png"
                  alt="Fon's"
                  width={156}
                  height={46}
                  priority
                  className="h-9 w-auto object-contain sm:h-10"
                />
              </div>

              <div className="space-y-1.5 text-center">
                <p className="text-sm font-medium text-foreground/92">
                  Welcome back.
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Sign in with your active admin email and password to continue into Fon&apos;s internal workspace.
                </p>
              </div>
            </div>
          </div>
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}
