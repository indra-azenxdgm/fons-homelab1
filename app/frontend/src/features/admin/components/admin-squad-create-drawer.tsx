"use client";

import { useId, useRef, useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import {
  BackendApiError,
  createAdminSquadBrowser,
} from "@/features/admin/api/admin-browser-api";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 py-1.5 text-[11px] leading-4 outline-none transition focus:border-primary";

const fieldLabelClassName =
  "admin-kicker-label";

export function AdminSquadCreateDrawer() {
  const drawerDescriptionId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  async function onSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        await createAdminSquadBrowser({
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
        });
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        setError(
          error instanceof BackendApiError
            ? error.message || "Unable to create squad"
            : "Unable to create squad",
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
        aria-haspopup="dialog"
        aria-label="Add Squad"
        title="Add Squad"
      >
        <Plus className="size-3.5" />
        <span className="sr-only">Add squad</span>
      </Button>

      <AdminDrawer
        open={open}
        onOpenChange={handleOpenChange}
        title="Add squad"
        description="Create a new assignable person. Alias stays system-generated and duplicate guard rails remain active."
      >
        <form
          ref={formRef}
          action={onSubmit}
          className="space-y-3"
          aria-describedby={drawerDescriptionId}
        >
          <p id={drawerDescriptionId} className="admin-form-helper rounded-[1rem] border border-border/70 bg-muted/30 px-4 py-2">
            Fill in the contact details below. The alias is generated automatically after creation.
          </p>

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Full name</span>
            <input
              name="name"
              type="text"
              placeholder="Full name"
              required
              className={fieldClassName}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Phone</span>
            <input
              name="phone"
              type="text"
              placeholder="Phone"
              className={fieldClassName}
            />
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Email</span>
            <input
              name="email"
              type="email"
              placeholder="Email"
              className={fieldClassName}
            />
          </label>

          {error ? (
            <div className="rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-2 text-[11px] leading-4 text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end border-t border-border/70 pt-3">
            <Button
              type="submit"
              className="admin-button-text h-8 rounded-full px-3"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Creating
                </>
              ) : (
                "Create squad"
              )}
            </Button>
          </div>
        </form>
      </AdminDrawer>
    </>
  );
}
