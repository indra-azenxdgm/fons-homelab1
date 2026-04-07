"use client";

import { type FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BackendApiError, changeAdminPasswordBrowser } from "@/features/admin/api/admin-browser-api";
import { InputControl } from "@/features/booking/components/input-control";
import { FormField } from "@/features/booking/components/form-field";

export function AdminChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitChange(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      await changeAdminPasswordBrowser({
        currentPassword: String(formData.get("currentPassword") || ""),
        newPassword: String(formData.get("newPassword") || ""),
        confirmPassword: String(formData.get("confirmPassword") || ""),
      });
      window.location.replace("/admin/dashboard");
    } catch (nextError) {
      setError(
        nextError instanceof BackendApiError
          ? getChangePasswordErrorMessage(nextError)
          : "Unable to change password",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitChange(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-2">
      <FormField label="Current password" htmlFor="currentPassword">
        <InputControl id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
      </FormField>
      <FormField label="New password" htmlFor="newPassword">
        <InputControl id="newPassword" name="newPassword" type="password" autoComplete="new-password" />
      </FormField>
      <FormField label="Confirm new password" htmlFor="confirmPassword">
        <InputControl id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
      </FormField>

      <p className="pt-2 text-xs leading-5 text-muted-foreground">
        Password must be at least 10 characters and include uppercase, lowercase, and numeric characters.
      </p>

      {error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="mt-3 h-12 w-full rounded-full text-sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Updating password
          </>
        ) : (
          <>
            <LockKeyhole className="size-4" />
            Update password
          </>
        )}
      </Button>
    </form>
  );
}

function getChangePasswordErrorMessage(error: BackendApiError) {
  if (error.code === "current_password_invalid") {
    return "Current password is not correct.";
  }

  if (error.code === "password_policy_invalid") {
    return "Use at least 10 characters with uppercase, lowercase, and numeric characters.";
  }

  if (error.code === "invalid_password_change_payload") {
    return "Check the password fields and try again.";
  }

  return error.message || "Unable to change password";
}
