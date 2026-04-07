"use client";

import { type FormEvent, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pushAppToast } from "@/components/app-toast-viewport";

import { BackendApiError, loginAdminBrowser } from "@/features/admin/api/admin-browser-api";
import { InputControl } from "@/features/booking/components/input-control";
import { FormField } from "@/features/booking/components/form-field";

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function submitLogin(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await loginAdminBrowser(String(formData.get("email") || ""), String(formData.get("password") || ""));
      pushAppToast({
        title: "Welcome back",
        description: "Signed in successfully.",
      });
      window.location.replace(result.adminUser.mustChangePassword ? "/admin/change-password" : "/admin/dashboard");
    } catch (error) {
      setError(
        error instanceof BackendApiError
          ? getLoginErrorMessage(error)
          : "Unable to sign in",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitLogin(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-2">
      <FormField label="Email" htmlFor="email">
        <InputControl id="email" name="email" type="email" autoComplete="email" />
      </FormField>
      <FormField label="Password" htmlFor="password">
        <div className="relative">
          <InputControl
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            className="pr-12"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            onClick={() => setIsPasswordVisible((value) => !value)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
          >
            {isPasswordVisible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </div>
      </FormField>

      {error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="mt-3 h-12 w-full rounded-full text-sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

function getLoginErrorMessage(error: BackendApiError) {
  if (error.code === "inactive_admin") {
    return "Your account is inactive. Contact a Super Admin for access.";
  }

  if (error.code === "invalid_admin_credentials") {
    return "Invalid email or password";
  }

  if (error.code === "invalid_admin_credentials_payload") {
    return "Enter a valid email and password";
  }

  if (error.code === "backend_unavailable") {
    return "Login service unavailable";
  }

  if (error.status >= 500) {
    return "Login service unavailable";
  }

  return error.message || "Unable to sign in";
}
