"use client";

import { useId, useRef, useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import { BackendApiError, createAdminUserBrowser } from "@/features/admin/api/admin-browser-api";
import { AdminUserTemporaryPasswordPanel } from "@/features/admin/components/admin-user-temporary-password-panel";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 py-1.5 text-[11px] leading-4 outline-none transition focus:border-primary";

const fieldLabelClassName =
  "admin-kicker-label";

type CreateResultState = {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
} | null;

export function AdminUserCreateDrawer() {
  const drawerDescriptionId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<CreateResultState>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      setCreateResult(null);
      formRef.current?.reset();
    }
  }

  async function onSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await createAdminUserBrowser({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          role: String(formData.get("role") || "SQUAD") as "SUPER_ADMIN" | "ADMIN" | "SQUAD",
          isActive: String(formData.get("status") || "active") === "active",
        });

        setCreateResult({
          userName: result.user.name,
          userEmail: result.user.email,
          temporaryPassword: result.temporaryPassword,
        });
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof BackendApiError
            ? getAdminUserCreateErrorMessage(nextError)
            : "Unable to create user",
        );
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        className="admin-button-text size-8 rounded-[0.95rem]"
        onClick={() => setOpen(true)}
        aria-label="Add User"
        title="Add User"
      >
        <Plus className="size-3.5" />
        <span className="sr-only">Add user</span>
      </Button>

      <AdminDrawer
        open={open}
        onOpenChange={handleOpenChange}
        title={createResult ? "User invited" : "Add user"}
        description={createResult
          ? "Share the temporary password securely. The user must change it on first sign-in."
          : "Create an admin-managed user account with a one-time temporary password."}
      >
        {createResult ? (
          <div className="space-y-3">
            <div className="rounded-[1rem] border border-border/70 bg-muted/30 px-4 py-2">
              <p className="admin-card-title">{createResult.userName}</p>
              <p className="admin-meta-text mt-1">{createResult.userEmail}</p>
            </div>

            <AdminUserTemporaryPasswordPanel
              password={createResult.temporaryPassword}
              title="Temporary password generated"
              description="This account is marked to change password on first login."
            />

            <div className="flex justify-end border-t border-border/70 pt-3">
              <Button type="button" size="sm" className="admin-button-text rounded-full px-3" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form
            ref={formRef}
            action={onSubmit}
            className="space-y-3"
            aria-describedby={drawerDescriptionId}
          >
            <p id={drawerDescriptionId} className="admin-form-helper rounded-[1rem] border border-border/70 bg-muted/30 px-4 py-2">
              The system generates a temporary password automatically and requires the user to change it on first login.
            </p>

            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Full name</span>
              <input name="name" type="text" placeholder="Full name" required className={fieldClassName} />
            </label>

            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Email</span>
              <input name="email" type="email" placeholder="Email" required className={fieldClassName} />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className={fieldLabelClassName}>Role</span>
                <select name="role" defaultValue="SQUAD" className={fieldClassName}>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SQUAD">Squad</option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className={fieldLabelClassName}>Status</span>
                <select name="status" defaultValue="active" className={fieldClassName}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            {error ? (
              <div className="rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-2 text-[11px] leading-4 text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end border-t border-border/70 pt-3">
              <Button type="submit" size="sm" className="admin-button-text rounded-full px-3" disabled={isPending}>
                {isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Creating user
                  </>
                ) : (
                  "Create user"
                )}
              </Button>
            </div>
          </form>
        )}
      </AdminDrawer>
    </>
  );
}

function getAdminUserCreateErrorMessage(error: BackendApiError) {
  if (error.code === "admin_user_email_conflict") {
    return "Another user with this email already exists.";
  }

  return error.message || "Unable to create user";
}
