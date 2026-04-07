"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { Building2, Globe, ImagePlus, Mail, MapPin, Phone, Trash2 } from "lucide-react";
import Image from "next/image";

import { pushAppToast } from "@/components/app-toast-viewport";
import {
  BackendApiError,
  updateAdminCompanyProfileBrowser,
  uploadAdminCompanyLogoBrowser,
} from "@/features/admin/api/company-profile-browser-api";
import type {
  AdminCompanyProfile,
  AdminCompanyProfileInput,
} from "@/features/admin/lib/shared/admin-company-profile-types";

type AdminCompanyProfileSettingsProps = {
  initialProfile: AdminCompanyProfile;
};

const allowedLogoMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

type CompanyProfileFormState = {
  companyName: string;
  companyTagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string | null;
};

function createFormState(profile: AdminCompanyProfile): CompanyProfileFormState {
  return {
    companyName: profile.companyName || "",
    companyTagline: profile.companyTagline || "",
    address: profile.address || "",
    phone: profile.phone || "",
    email: profile.email || "",
    website: profile.website || "",
    logoUrl: profile.logoUrl || null,
  };
}

function getPreviewContactLine(form: CompanyProfileFormState) {
  return [form.phone.trim(), form.email.trim(), form.website.trim()].filter(Boolean).join(" | ");
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "FN";
}

function normalizeInput(form: CompanyProfileFormState): AdminCompanyProfileInput {
  return {
    companyName: form.companyName.trim(),
    companyTagline: form.companyTagline.trim() || null,
    address: form.address.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    website: form.website.trim() || null,
    logoUrl: form.logoUrl?.trim() || null,
  };
}

export function AdminCompanyProfileSettings({
  initialProfile,
}: AdminCompanyProfileSettingsProps) {
  const [form, setForm] = useState(() => createFormState(initialProfile));
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSaveDisabled = isPending || isUploadingLogo || !form.companyName.trim();
  const previewContactLine = getPreviewContactLine(form);

  function updateField<K extends keyof CompanyProfileFormState>(key: K, value: CompanyProfileFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    if (fieldErrors[key]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }

    if (key === "logoUrl") {
      setLogoError(null);
    }
  }

  function resetForm() {
    setForm(createFormState(savedProfile));
    setFieldErrors({});
    setFormError(null);
    setLogoError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleLogoUpload(file: File) {
    setLogoError(null);
    setIsUploadingLogo(true);

    try {
      const result = await uploadAdminCompanyLogoBrowser(file);
      updateField("logoUrl", result.logoUrl);
      pushAppToast({
        title: "Logo uploaded",
        description: "Save changes to apply this logo to export headers.",
      });
    } catch (error) {
      const message =
        error instanceof BackendApiError
          ? error.message
          : "Unable to upload the company logo right now.";
      setLogoError(message);
    } finally {
      setIsUploadingLogo(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedLogoMimeTypes.has(file.type)) {
      setLogoError("Upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setLogoError("Logo file must be 3 MB or smaller.");
      return;
    }

    void handleLogoUpload(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const payload = normalizeInput(form);

    startTransition(() => {
      void (async () => {
        try {
          const result = await updateAdminCompanyProfileBrowser(payload);
          const nextProfile = result.profile as AdminCompanyProfile;
          setSavedProfile(nextProfile);
          setForm(createFormState(nextProfile));
          pushAppToast({
            title: "Company profile saved",
            description: "Export header identity has been updated.",
          });
        } catch (error) {
          if (error instanceof BackendApiError) {
            const payloadData = error.data as {
              error?: {
                fieldErrors?: Record<string, string[]>;
                formErrors?: string[];
              };
            } | null;

            setFieldErrors(payloadData?.error?.fieldErrors || {});
            setFormError(payloadData?.error?.formErrors?.[0] || error.message);
            return;
          }

          setFormError("Unable to save company profile right now.");
        }
      })();
    });
  }

  return (
    <section className="space-y-4">
      <section className="panel p-5">
        <div className="flex flex-col gap-2">
          <p className="admin-section-title">Company profile</p>
          <p className="admin-section-copy">
            Manage the company identity that will appear in export and PDF headers across the admin workspace.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
        <form onSubmit={handleSubmit} className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="admin-card-title">Header identity fields</p>
              <p className="admin-form-helper mt-1">
                Keep this profile lightweight and production-ready for future PDF/export modules.
              </p>
            </div>
            {isPending ? (
              <span className="admin-form-helper">Saving...</span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="admin-form-label">Company Name</span>
              <input
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                placeholder="Fon's Air Conditioner Service"
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
              {fieldErrors.companyName ? <p className="text-[11px] text-destructive">{fieldErrors.companyName[0]}</p> : null}
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="admin-form-label">Tagline</span>
              <input
                value={form.companyTagline}
                onChange={(event) => updateField("companyTagline", event.target.value)}
                placeholder="AC cleaning, repair, and installation"
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="admin-form-label">Address</span>
              <textarea
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Jl. Example No. 88, Bekasi"
                rows={4}
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <label className="space-y-1.5">
              <span className="admin-form-label">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+62 812 0000 0000"
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <label className="space-y-1.5">
              <span className="admin-form-label">Email</span>
              <input
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="hello@fons.id"
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
              {fieldErrors.email ? <p className="text-[11px] text-destructive">{fieldErrors.email[0]}</p> : null}
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="admin-form-label">Website</span>
              <input
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="www.fons.id"
                className="w-full rounded-[1rem] border border-border/70 bg-white px-3.5 py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
              {fieldErrors.website ? <p className="text-[11px] text-destructive">{fieldErrors.website[0]}</p> : null}
            </label>
          </div>

          {formError ? (
            <div className="mt-4 rounded-[1rem] border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-[12px] leading-5 text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isPending || isUploadingLogo}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border/70 bg-white px-4 text-[12px] font-medium text-foreground transition hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <section className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="admin-card-title">Company logo</p>
                <p className="admin-form-helper mt-1">
                  Upload a clean logo for future PDF and export headers.
                </p>
              </div>
              {isUploadingLogo ? <span className="admin-form-helper">Uploading...</span> : null}
            </div>

            <div className="mt-4 rounded-[1.2rem] border border-dashed border-border/80 bg-white/70 p-4">
              {form.logoUrl ? (
                <div className="flex flex-col gap-3">
                  <div className="flex min-h-28 items-center justify-center rounded-[1rem] border border-border/70 bg-muted/20 p-4">
                    <Image
                      src={form.logoUrl}
                      alt="Company logo preview"
                      width={192}
                      height={96}
                      unoptimized
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">{form.logoUrl}</p>
                </div>
              ) : (
                <div className="flex min-h-28 flex-col items-center justify-center rounded-[1rem] border border-border/70 bg-muted/20 px-4 py-5 text-center">
                  <ImagePlus className="size-5 text-muted-foreground" />
                  <p className="mt-2 text-[12px] font-medium text-foreground">No logo uploaded</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    PNG, JPG, or WEBP up to 3 MB.
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo || isPending}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border/70 bg-white px-4 text-[12px] font-medium text-foreground transition hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {form.logoUrl ? "Replace Logo" : "Upload Logo"}
                </button>
                {form.logoUrl ? (
                  <button
                    type="button"
                    onClick={() => updateField("logoUrl", null)}
                    disabled={isUploadingLogo || isPending}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-4 text-[12px] font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                    Remove Logo
                  </button>
                ) : null}
              </div>

              {logoError ? (
                <p className="mt-3 text-[11px] text-destructive">{logoError}</p>
              ) : null}
            </div>
          </section>

          <section className="panel p-5">
            <div>
              <p className="admin-card-title">Export header preview</p>
              <p className="admin-form-helper mt-1">
                This preview shows how company identity will appear in future PDF/export headers.
              </p>
            </div>

            <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-white/72 p-4 shadow-[0_12px_28px_-28px_rgba(15,23,42,0.14)]">
              <div className="flex items-start gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-border/70 bg-muted/20">
                  {form.logoUrl ? (
                    <Image
                      src={form.logoUrl}
                      alt="Company logo header preview"
                      width={56}
                      height={56}
                      unoptimized
                      className="size-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-[13px] font-semibold text-muted-foreground">{getInitials(form.companyName || savedProfile.companyName || "Fon's")}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
                    {form.companyName.trim() || "Company name"}
                  </p>
                  {form.companyTagline.trim() ? (
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{form.companyTagline.trim()}</p>
                  ) : null}

                  <div className="mt-3 space-y-2 text-[11px] leading-5 text-muted-foreground">
                    {form.address.trim() ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        <span>{form.address.trim()}</span>
                      </div>
                    ) : null}

                    {previewContactLine ? (
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 size-3.5 shrink-0" />
                        <span>{previewContactLine}</span>
                      </div>
                    ) : null}

                    {!form.address.trim() && !previewContactLine ? (
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 size-3.5 shrink-0" />
                        <span>Add address, phone, email, or website to complete the export header identity.</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    {form.email.trim() ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/15 px-2.5 py-1">
                        <Mail className="size-3" />
                        {form.email.trim()}
                      </span>
                    ) : null}
                    {form.website.trim() ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/15 px-2.5 py-1">
                        <Globe className="size-3" />
                        {form.website.trim()}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
