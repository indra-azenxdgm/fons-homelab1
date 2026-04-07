"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  LocateFixed,
  LoaderCircle,
  MessageCircleMore,
  PhoneCall,
  Wind,
} from "lucide-react";
import { type FieldErrors, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

import { FormField } from "@/features/booking/components/form-field";
import { DateInputControl } from "@/features/booking/components/date-input-control";
import { InputControl } from "@/features/booking/components/input-control";
import { SlotPicker } from "@/features/booking/components/slot-picker";
import { TextareaControl } from "@/features/booking/components/textarea-control";
import { TurnstileWidget } from "@/features/booking/components/turnstile-widget";
import {
  bookingSchema,
  type BookingFormValues,
  type ParsedBookingFormValues,
} from "@/features/booking/lib/booking-schema";
import {
  buildPublicBookingServiceSummary,
  CLEANING_VARIANTS,
  getPublicServiceDescription,
  getPublicServiceVisual,
  REPAIR_ISSUES,
  SERVICE_TYPE_SLUGS,
  sortPublicServiceTypes,
  type PublicServiceType,
} from "@/features/booking/lib/public-service-config";

type SubmitState = "idle" | "submitting" | "success" | "error";

type Slot = {
  value: string;
  label: string;
  available: boolean;
};

type BookingFormProps = {
  serviceTypes: PublicServiceType[];
  defaultDate: string;
  initialSlots: Slot[];
};

const FIELD_SCROLL_ORDER: (keyof BookingFormValues)[] = [
  "serviceTypeId",
  "serviceVariant",
  "repairIssue",
  "serviceComplaint",
  "bookingDate",
  "timeSlot",
  "name",
  "phone",
  "email",
  "address",
  "turnstileToken",
];

function buildCoordinateAddressFallback() {
  return "Alamat dari lokasi GPS, silakan lengkapi nama jalan, nomor rumah, atau patokan terdekat.";
}

export function BookingForm({
  serviceTypes,
  defaultDate,
  initialSlots,
}: BookingFormProps) {
  const orderedServiceTypes = sortPublicServiceTypes(serviceTypes);
  const router = useRouter();
  const [startedAt] = useState(() => String(Date.now()));
  const [submissionKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [slots, setSlots] = useState(initialSlots);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [isLoadingSlots, startSlotTransition] = useTransition();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const fieldContainerRefs = useRef<
    Partial<Record<keyof BookingFormValues, HTMLElement | null>>
  >({});
  const fieldTargetRefs = useRef<
    Partial<Record<keyof BookingFormValues, HTMLElement | null>>
  >({});
  const lastAutoFilledAddressRef = useRef<string | null>(null);

  function setFieldContainerRef(
    field: keyof BookingFormValues,
    node: HTMLElement | null,
  ) {
    fieldContainerRefs.current[field] = node;
  }

  function setFieldTargetRef(
    field: keyof BookingFormValues,
    node: HTMLElement | null,
  ) {
    fieldTargetRefs.current[field] = node;
  }

  function getFieldTarget(field: keyof BookingFormValues) {
    const explicitTarget = fieldTargetRefs.current[field];

    if (explicitTarget) {
      return explicitTarget;
    }

    const container = fieldContainerRefs.current[field];

    if (!container) {
      return null;
    }

    if (field === "timeSlot") {
      return (
        container.querySelector<HTMLButtonElement>("button[aria-pressed='true']") ||
        container.querySelector<HTMLButtonElement>("button:not([disabled])")
      );
    }

    if (field === "serviceTypeId") {
      return (
        container.querySelector<HTMLInputElement>("input[type='radio']:checked") ||
        container.querySelector<HTMLInputElement>("input[type='radio']")
      );
    }

    return (
      container.querySelector<HTMLElement>(
        "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
      ) || container
    );
  }

  function focusField(field: keyof BookingFormValues) {
    const container = fieldContainerRefs.current[field];
    const target = getFieldTarget(field);

    if (!container && !target) {
      return;
    }

    (container || target)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    if (target && "focus" in target && typeof target.focus === "function") {
      window.setTimeout(() => {
        target.focus({
          preventScroll: true,
        });
      }, 120);
    }
  }

  const form = useForm<BookingFormValues, unknown, ParsedBookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceTypeId: orderedServiceTypes[0]?.id || "",
      bookingDate: defaultDate,
      timeSlot: undefined,
      name: "",
      phone: "",
      email: "",
      address: "",
      mapsUrl: "",
      latitude: undefined,
      longitude: undefined,
      notes: "",
      serviceVariant: "",
      repairIssue: "",
      serviceComplaint: "",
      website: "",
      submissionKey,
      turnstileToken: "",
    },
    mode: "onBlur",
  });

  const selectedDate = form.watch("bookingDate");
  const selectedSlot = form.watch("timeSlot");
  const selectedServiceId = form.watch("serviceTypeId");
  const selectedServiceVariant = form.watch("serviceVariant");
  const selectedRepairIssue = form.watch("repairIssue");
  const selectedServiceComplaint = form.watch("serviceComplaint");
  const mapsUrl = form.watch("mapsUrl");
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const addressValue = form.watch("address");
  const quickHelpWhatsAppNumber = publicEnv.whatsappNumber;
  const quickHelpWhatsAppHref = `https://wa.me/${quickHelpWhatsAppNumber.replace(/[^\d]/g, "")}`;
  const selectedService = orderedServiceTypes.find((serviceType) => serviceType.id === selectedServiceId) || null;
  const selectedServiceVisual = selectedService ? getPublicServiceVisual(selectedService) : null;
  const selectedServiceDescription = selectedService ? getPublicServiceDescription(selectedService) : null;
  const selectedServiceName = selectedServiceVisual?.displayName || selectedService?.name || "";
  const requiresCleaningVariant = selectedService?.slug === SERVICE_TYPE_SLUGS.CLEANING;
  const requiresRepairIssue = selectedService?.slug === SERVICE_TYPE_SLUGS.REPAIR;
  const requiresComplaint = selectedService?.slug === SERVICE_TYPE_SLUGS.OTHER;
  const shouldShowComplaintField = requiresRepairIssue || requiresComplaint;
  const serviceSummaryLabel = selectedServiceName
    ? buildPublicBookingServiceSummary({
        serviceName: selectedServiceName,
        serviceVariant: selectedServiceVariant,
        repairIssue: selectedRepairIssue,
      })
    : "Belum dipilih";

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    startSlotTransition(async () => {
      setSlotError(null);

      try {
        const response = await fetch(
          `/api/public/booking-availability?date=${encodeURIComponent(selectedDate)}`,
        );

        if (!response.ok) {
          throw new Error("Tidak dapat memuat slot booking");
        }

        const data = (await response.json()) as
          | { ok: true; data: { slots: Slot[] } }
          | { ok: false; error: { message: string } };

        if (!response.ok || !data.ok) {
          throw new Error(
            data.ok ? "Tidak dapat memuat slot booking" : data.error.message,
          );
        }

        setSlots(data.data.slots);

        const currentSlot = form.getValues("timeSlot");
        const stillAvailable = data.data.slots.some(
          (slot) => slot.value === currentSlot && slot.available,
        );

        if (!stillAvailable) {
          form.setValue("timeSlot", undefined as never, {
            shouldValidate: true,
          });
        }
      } catch (error) {
        console.error(error);
        setSlotError("Slot yang tersedia belum bisa dimuat saat ini");
      }
    });
  }, [form, selectedDate]);

  const {
    register,
    handleSubmit,
    formState: { dirtyFields, errors, isSubmitting },
    clearErrors,
    setError,
    setFocus,
    setValue,
  } = form;
  const serviceTypeField = register("serviceTypeId");
  const serviceVariantField = register("serviceVariant");
  const repairIssueField = register("repairIssue");
  const serviceComplaintField = register("serviceComplaint");
  const bookingDateField = register("bookingDate");
  const nameField = register("name");
  const phoneField = register("phone");
  const emailField = register("email");
  const addressField = register("address");

  useEffect(() => {
    if (!requiresCleaningVariant && form.getValues("serviceVariant")) {
      form.setValue("serviceVariant", "", { shouldDirty: true });
      clearErrors("serviceVariant");
    }

    if (!requiresRepairIssue && form.getValues("repairIssue")) {
      form.setValue("repairIssue", "", { shouldDirty: true });
      clearErrors("repairIssue");
    }

    if (!shouldShowComplaintField && form.getValues("serviceComplaint")) {
      form.setValue("serviceComplaint", "", { shouldDirty: true });
      clearErrors("serviceComplaint");
    }
  }, [clearErrors, form, requiresCleaningVariant, requiresRepairIssue, shouldShowComplaintField]);

  const coordinatesLabel =
    typeof latitude === "number" && typeof longitude === "number"
      ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : null;

  function findFirstInvalidField(formErrors: FieldErrors<BookingFormValues>) {
    return FIELD_SCROLL_ORDER.find((field) => {
      if (field === "address") {
        return Boolean(
          formErrors.address || formErrors.latitude || formErrors.longitude,
        );
      }

      return Boolean(formErrors[field]);
    });
  }

  function focusFirstInvalidField(formErrors: FieldErrors<BookingFormValues>) {
    const firstInvalidField = findFirstInvalidField(formErrors);

    if (!firstInvalidField) {
      return;
    }

    focusField(firstInvalidField);

    if (firstInvalidField === "serviceTypeId" || firstInvalidField === "timeSlot") {
      return;
    }

    window.setTimeout(() => {
      setFocus(firstInvalidField);
    }, 140);
  }

  function shouldPrefillAddress(nextValue: string) {
    const currentAddress = form.getValues("address").trim();
    const lastAutoFilledAddress = lastAutoFilledAddressRef.current?.trim() || "";

    if (!nextValue.trim()) {
      return false;
    }

    if (!currentAddress) {
      return true;
    }

    if (!dirtyFields.address) {
      return true;
    }

    return currentAddress === lastAutoFilledAddress;
  }

  function handleUseCurrentLocation() {
    setLocationError(null);
    setLocationMessage(null);

    if (!navigator.geolocation) {
      setLocationError("Perangkat ini belum mendukung pengambilan lokasi otomatis.");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLatitude = Number(position.coords.latitude.toFixed(6));
        const nextLongitude = Number(position.coords.longitude.toFixed(6));
        const generatedMapsUrl = `https://www.google.com/maps?q=${nextLatitude},${nextLongitude}`;
        const fallbackAddress = buildCoordinateAddressFallback();

        setValue("latitude", nextLatitude, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("longitude", nextLongitude, {
          shouldDirty: true,
          shouldValidate: true,
        });

        if (!form.getValues("mapsUrl")) {
          setValue("mapsUrl", generatedMapsUrl, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        clearErrors(["address", "latitude", "longitude"]);

        try {
          const response = await fetch(
            `/api/public/location/reverse-geocode?lat=${encodeURIComponent(String(nextLatitude))}&lng=${encodeURIComponent(String(nextLongitude))}`,
          );

          if (!response.ok) {
            throw new Error("reverse_geocode_failed");
          }

          const data = (await response.json()) as
            | { ok: true; data: { address: string | null } }
            | { ok: false; error: { message: string } };
          const suggestedAddress =
            response.ok && data.ok && data.data.address
              ? data.data.address
              : fallbackAddress;
          const addressWasPrefilled = shouldPrefillAddress(suggestedAddress);

          if (addressWasPrefilled) {
            setValue("address", suggestedAddress, {
              shouldDirty: true,
              shouldValidate: true,
            });
            lastAutoFilledAddressRef.current = suggestedAddress;
          }

          setLocationMessage(
            response.ok && data.ok && data.data.address
              ? addressWasPrefilled
                ? "Lokasi berhasil diambil dan alamat servis sudah diisi otomatis. Anda tetap bisa mengeditnya."
                : "Lokasi berhasil diambil. Alamat manual Anda tetap dipertahankan, tetapi titik lokasi sudah tersimpan."
              : addressWasPrefilled
                ? "Lokasi berhasil diambil. Silakan lengkapi nama jalan, nomor, atau patokan agar teknisi lebih mudah menemukan alamat."
                : "Lokasi berhasil diambil. Alamat manual Anda tetap dipertahankan, tetapi titik lokasi sudah tersimpan.",
          );
        } catch {
          const addressWasPrefilled = shouldPrefillAddress(fallbackAddress);

          if (addressWasPrefilled) {
            setValue("address", fallbackAddress, {
              shouldDirty: true,
              shouldValidate: true,
            });
            lastAutoFilledAddressRef.current = fallbackAddress;
          }

          setLocationMessage(
            addressWasPrefilled
              ? "Lokasi berhasil diambil. Silakan lengkapi nama jalan, nomor, atau patokan agar teknisi lebih mudah menemukan alamat."
              : "Lokasi berhasil diambil. Alamat manual Anda tetap dipertahankan, tetapi titik lokasi sudah tersimpan.",
          );
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Anda tetap bisa isi alamat servis secara manual."
            : "Lokasi belum bisa dideteksi. Coba lagi atau gunakan alamat manual.";

        setLocationError(message);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    if (submitState === "submitting") {
      return;
    }

    const conditionalErrors: FieldErrors<BookingFormValues> = {};

    clearErrors("root");
    clearErrors(["serviceVariant", "repairIssue", "serviceComplaint"]);

    if (requiresCleaningVariant && !values.serviceVariant) {
      conditionalErrors.serviceVariant = {
        type: "manual",
        message: "Pilih tipe AC untuk layanan Cuci AC.",
      };
      setError("serviceVariant", conditionalErrors.serviceVariant);
    }

    if (requiresRepairIssue && !values.repairIssue) {
      conditionalErrors.repairIssue = {
        type: "manual",
        message: "Pilih jenis kendala untuk layanan Perbaikan.",
      };
      setError("repairIssue", conditionalErrors.repairIssue);
    }

    if (
      (requiresComplaint || (requiresRepairIssue && values.repairIssue === "Lainnya"))
      && !values.serviceComplaint
    ) {
      conditionalErrors.serviceComplaint = {
        type: "manual",
        message: requiresComplaint ? "Jelaskan kebutuhan servis Anda." : "Jelaskan keluhan untuk opsi Lainnya.",
      };
      setError("serviceComplaint", conditionalErrors.serviceComplaint);
    }

    if (Object.keys(conditionalErrors).length) {
      setSubmitState("error");
      setSubmitFeedback(null);
      focusFirstInvalidField(conditionalErrors);
      return;
    }

    setSubmitState("submitting");
    setSubmitFeedback(null);
    clearErrors("root");

    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            ok: true;
            data: {
              bookingCode?: string;
            };
          }
        | {
            ok: false;
            error: {
              category: "validation" | "conflict" | "rate_limit" | "security" | "system";
              code: string;
              message: string;
              fieldErrors?: Record<string, string[]>;
            };
          }
        | null;

      function getFriendlyBookingErrorMessage(error: {
        category: "validation" | "conflict" | "rate_limit" | "security" | "system";
        code: string;
        message: string;
      }) {
        switch (error.code) {
          case "invalid_request":
          case "invalid_json":
            return "Silakan lengkapi dan periksa kembali data booking Anda.";
          case "duplicate_active_booking":
            return "Sudah ada booking serupa pada nomor HP, tanggal, dan jam yang sama.";
          case "slot_unavailable":
            return "Slot yang dipilih sudah tidak tersedia. Silakan pilih jam lain.";
          case "booking_rate_limited":
            return "Terlalu banyak percobaan booking. Silakan tunggu beberapa menit lalu coba lagi.";
          case "turnstile_token_missing":
            return "Sesi verifikasi berakhir. Silakan verifikasi ulang lalu kirim lagi.";
          case "turnstile_verification_failed":
            return "Verifikasi gagal. Silakan coba lagi.";
          case "suspicious_submission_blocked":
            return "Pemesanan belum bisa diproses saat ini. Silakan muat ulang halaman lalu coba lagi.";
          case "anti_bot_unavailable":
            return "Verifikasi sedang bermasalah. Silakan coba lagi beberapa saat lagi.";
          case "backend_unavailable":
          case "internal_server_error":
          case "booking_failed":
            return "Terjadi kendala pada sistem. Silakan coba lagi beberapa saat lagi.";
          default:
            return error.message;
        }
      }

      if (!response.ok || !data?.ok) {
        if (data && !data.ok && data.error.fieldErrors) {
          Object.entries(data.error.fieldErrors).forEach(([field, fieldErrors]) => {
            const firstError = fieldErrors[0];

            if (firstError) {
              setError(field as keyof BookingFormValues, {
                type: "server",
                message: firstError,
              });
            }
          });

          focusFirstInvalidField(
            data.error.fieldErrors as unknown as FieldErrors<BookingFormValues>,
          );
        }

        setError("root", {
          type: "server",
          message:
            data && !data.ok
              ? getFriendlyBookingErrorMessage(data.error)
              : "Pemesanan belum berhasil dikirim. Periksa koneksi Anda lalu coba lagi.",
        });
        setSubmitState("error");
        return;
      }

      const bookingCode = data.data.bookingCode;

      if (!bookingCode) {
        setError("root", {
          type: "server",
          message: "Pemesanan berhasil diproses, tetapi kode booking belum diterima. Silakan coba lagi beberapa saat lagi.",
        });
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
      setSubmitFeedback("Pemesanan diterima. Mengarahkan ke halaman konfirmasi...");
      router.push(`/booking/success?code=${encodeURIComponent(bookingCode)}`);
    } catch {
      setError("root", {
        type: "server",
        message: "Pemesanan belum berhasil dikirim. Periksa koneksi Anda lalu coba lagi.",
      });
      setSubmitState("error");
    }
  }, handleInvalidSubmit);

  function handleInvalidSubmit(errors: FieldErrors<BookingFormValues>) {
    setSubmitState("error");
    setSubmitFeedback(null);
    focusFirstInvalidField(errors);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start">
      <section className="min-w-0 space-y-4">
        <div className="rounded-[1.65rem] border border-border bg-white px-5 py-5 text-foreground shadow-[0_14px_28px_-24px_rgba(0,81,162,0.2)] sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="shrink-0">
                <Image
                  src="/fons-header.png"
                  alt="Fon's"
                  width={132}
                  height={40}
                  priority
                  className="h-8 w-auto object-contain sm:h-9"
                />
              </div>

              <div className="min-w-0 max-w-xl space-y-2">
                <h1 className="text-[1.34rem] font-medium leading-[1.14] tracking-[-0.015em] text-balance text-foreground sm:text-[1.55rem]">
                  Booking servis AC Fon&apos;s.
                </h1>
                <p className="max-w-lg text-[12px] leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
                  Pilih layanan, tentukan jadwal, lalu kirim detail lokasi.
                </p>
              </div>
            </div>

            <div className="sm:shrink-0">
              <Link
                href="/home"
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-[12px] font-medium text-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary sm:text-[13px]"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>

        <section className="panel p-5 sm:p-7">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div ref={(node) => setFieldContainerRef("serviceTypeId", node)} tabIndex={-1}>
              <FormField
                label="Pilih layanan"
                htmlFor="serviceTypeId"
                error={errors.serviceTypeId?.message}
              >
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {orderedServiceTypes.map((serviceType) => {
                  const checked = selectedServiceId === serviceType.id;
                  const visual = getPublicServiceVisual(serviceType);
                  const Icon = visual.icon;

                  return (
                    <label
                      key={serviceType.id}
                      className={cn(
                        "relative flex min-w-0 cursor-pointer flex-col items-center gap-2.5 rounded-[1.35rem] border border-border bg-white px-3 py-4 text-center transition hover:border-[color:var(--border-strong)] hover:bg-secondary",
                        checked
                          ? "border-primary bg-secondary shadow-[0_12px_22px_-20px_rgba(0,81,162,0.16)]"
                          : "",
                      )}
                    >
                      <input
                        type="radio"
                        value={serviceType.id}
                        className="sr-only"
                        {...serviceTypeField}
                        ref={(node) => {
                          serviceTypeField.ref(node);

                          if (checked || !fieldTargetRefs.current.serviceTypeId) {
                            setFieldTargetRef("serviceTypeId", node);
                          }
                        }}
                      />
                      <div
                        className={cn(
                          "flex size-13 items-center justify-center rounded-[1.15rem] border border-border bg-accent text-primary sm:size-14",
                          checked ? "border-primary bg-primary text-white" : "",
                        )}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium leading-4 text-foreground sm:text-[12px]">
                          {visual.shortLabel}
                        </p>
                        {checked ? (
                          <p className="mt-1 text-[10px] font-medium leading-4 text-primary">
                            Dipilih
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
                </div>
                {selectedServiceId ? (
                  <div className="mt-3 rounded-[1.1rem] border border-border bg-secondary px-4 py-3 text-[11px] leading-5 text-muted-foreground sm:text-[12px]">
                    {selectedServiceDescription || "Pilih layanan yang paling sesuai dengan kebutuhan servis Anda."}
                  </div>
                ) : null}
              </FormField>
            </div>

            {requiresCleaningVariant ? (
              <div ref={(node) => setFieldContainerRef("serviceVariant", node)} tabIndex={-1}>
                <FormField
                  label="Tipe AC untuk dicuci"
                  htmlFor="serviceVariant"
                  error={errors.serviceVariant?.message}
                >
                  <select
                    id="serviceVariant"
                    className="flex h-12 w-full rounded-[1.1rem] border border-border bg-white px-4 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:border-[color:var(--border-strong)] focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={selectedServiceVariant || ""}
                    {...serviceVariantField}
                    onChange={(event) => {
                      serviceVariantField.onChange(event);
                      clearErrors("serviceVariant");
                      form.setValue("serviceVariant", event.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    ref={(node) => {
                      serviceVariantField.ref(node);
                      setFieldTargetRef("serviceVariant", node);
                    }}
                  >
                    <option value="">Pilih tipe AC</option>
                    {CLEANING_VARIANTS.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            ) : null}

            {requiresRepairIssue ? (
              <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
                <div ref={(node) => setFieldContainerRef("repairIssue", node)} tabIndex={-1}>
                  <FormField
                    label="Jenis kendala"
                    htmlFor="repairIssue"
                    error={errors.repairIssue?.message}
                  >
                    <select
                      id="repairIssue"
                      className="flex h-12 w-full rounded-[1.1rem] border border-border bg-white px-4 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:border-[color:var(--border-strong)] focus:border-primary focus:ring-4 focus:ring-primary/10"
                      value={selectedRepairIssue || ""}
                      {...repairIssueField}
                      onChange={(event) => {
                        repairIssueField.onChange(event);
                        clearErrors("repairIssue");
                        form.setValue("repairIssue", event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      ref={(node) => {
                        repairIssueField.ref(node);
                        setFieldTargetRef("repairIssue", node);
                      }}
                    >
                      <option value="">Pilih kendala</option>
                      {REPAIR_ISSUES.map((issue) => (
                        <option key={issue} value={issue}>
                          {issue}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div ref={(node) => setFieldContainerRef("serviceComplaint", node)} tabIndex={-1}>
                  <FormField
                    label="Detail keluhan"
                    htmlFor="serviceComplaint"
                    hint={selectedRepairIssue === "Lainnya" ? "Wajib diisi" : "Opsional"}
                    error={errors.serviceComplaint?.message}
                  >
                    <TextareaControl
                      id="serviceComplaint"
                      placeholder="Contoh: AC hidup terus walau remote dimatikan, atau jelaskan kendala lainnya."
                      className="min-h-24"
                      {...serviceComplaintField}
                      ref={(node) => {
                        serviceComplaintField.ref(node);
                        setFieldTargetRef("serviceComplaint", node);
                      }}
                    />
                  </FormField>
                </div>
              </div>
            ) : null}

            {requiresComplaint ? (
              <div ref={(node) => setFieldContainerRef("serviceComplaint", node)} tabIndex={-1}>
                <FormField
                  label="Jelaskan kebutuhan"
                  htmlFor="serviceComplaint"
                  hint="Wajib diisi"
                  error={errors.serviceComplaint?.message}
                >
                  <TextareaControl
                    id="serviceComplaint"
                    placeholder="Tulis permintaan servis Anda secara singkat agar tim kami bisa menindaklanjuti dengan tepat."
                    className="min-h-24"
                    {...serviceComplaintField}
                    ref={(node) => {
                      serviceComplaintField.ref(node);
                      setFieldTargetRef("serviceComplaint", node);
                    }}
                  />
                </FormField>
              </div>
            ) : null}

            <div
              className="pt-0.5"
              ref={(node) => setFieldContainerRef("bookingDate", node)}
              tabIndex={-1}
            >
              <FormField
                label="Tanggal servis"
                htmlFor="bookingDate"
                error={errors.bookingDate?.message}
              >
                <DateInputControl
                  id="bookingDate"
                  min={defaultDate}
                  value={selectedDate}
                  {...bookingDateField}
                  ref={(node) => {
                    bookingDateField.ref(node);
                    setFieldTargetRef("bookingDate", node);
                  }}
                />
              </FormField>
            </div>

            <div
              className="-mt-1"
              ref={(node) => setFieldContainerRef("timeSlot", node)}
              tabIndex={-1}
            >
              <FormField
                label="Pilih Waktu"
                htmlFor="timeSlot"
                hint={isLoadingSlots ? "Memperbarui jadwal" : undefined}
                error={errors.timeSlot?.message || slotError || undefined}
              >
                {isLoadingSlots ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[52px] animate-pulse rounded-[1.45rem] bg-muted/60"
                      />
                    ))}
                  </div>
                ) : null}
                <SlotPicker
                  slots={slots}
                  value={selectedSlot}
                  disabled={isLoadingSlots}
                  onChange={(value) => {
                    setSlotError(null);
                    clearErrors("timeSlot");
                    form.setValue("timeSlot", value as BookingFormValues["timeSlot"], {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </FormField>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div ref={(node) => setFieldContainerRef("name", node)} tabIndex={-1}>
                <FormField
                  label="Nama lengkap"
                  htmlFor="name"
                  required
                  error={errors.name?.message}
                >
                  <InputControl
                    id="name"
                    autoComplete="name"
                    placeholder="Nama penerima servis"
                    {...nameField}
                    ref={(node) => {
                      nameField.ref(node);
                      setFieldTargetRef("name", node);
                    }}
                  />
                </FormField>
              </div>
              <div ref={(node) => setFieldContainerRef("phone", node)} tabIndex={-1}>
                <FormField
                  label="Nomor HP"
                  htmlFor="phone"
                  required
                  error={errors.phone?.message}
                >
                  <InputControl
                    id="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Nomor WhatsApp aktif"
                    {...phoneField}
                    ref={(node) => {
                      phoneField.ref(node);
                      setFieldTargetRef("phone", node);
                    }}
                  />
                </FormField>
              </div>
            </div>

            <div ref={(node) => setFieldContainerRef("email", node)} tabIndex={-1}>
              <FormField
                label="Email"
                htmlFor="email"
                required
                error={errors.email?.message}
              >
                <InputControl
                  id="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  {...emailField}
                  ref={(node) => {
                    emailField.ref(node);
                    setFieldTargetRef("email", node);
                  }}
                />
              </FormField>
            </div>

            <div ref={(node) => setFieldContainerRef("address", node)} tabIndex={-1}>
              <FormField
                label="Alamat servis"
                htmlFor="address"
                hint="Wajib diisi"
                error={
                  errors.address?.message ||
                  errors.latitude?.message ||
                  errors.longitude?.message
                }
              >
                <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-full px-3.5 text-[12px]"
                    onClick={handleUseCurrentLocation}
                    disabled={isDetectingLocation}
                  >
                    {isDetectingLocation ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Mengambil lokasi
                      </>
                    ) : (
                      <>
                        <LocateFixed className="size-4" />
                        Gunakan lokasi saya
                      </>
                    )}
                  </Button>
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-[12px] font-medium text-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary"
                    >
                      <ExternalLink className="size-4" />
                      Buka Google Maps
                    </a>
                  ) : null}
                </div>

                {(locationMessage || locationError || coordinatesLabel) ? (
                  <div
                    className={cn(
                      "rounded-[1.05rem] px-4 py-3 text-[11px] leading-5 ring-1 sm:text-[12px]",
                      locationError
                        ? "bg-destructive/8 text-destructive ring-destructive/12"
                        : "bg-emerald-50 text-emerald-800 ring-emerald-300/70",
                    )}
                  >
                    {locationError || locationMessage}
                    {coordinatesLabel ? (
                      <p className="mt-1 text-[11px] leading-4 opacity-80">
                        Titik tersimpan: {coordinatesLabel}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[1.05rem] border border-border bg-secondary px-4 py-3 text-[11px] leading-5 text-muted-foreground sm:text-[12px]">
                    Isi alamat lengkap tetap wajib. Lokasi otomatis hanya membantu teknisi menemukan titik servis dengan lebih akurat.
                  </div>
                )}

                <TextareaControl
                  id="address"
                  placeholder="Contoh: Ruko Dahlia No. 8, Jl. Veteran, Bintaro"
                  {...addressField}
                  ref={(node) => {
                    addressField.ref(node);
                    setFieldTargetRef("address", node);
                  }}
                />
                {addressValue ? (
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Alamat ini bisa Anda edit lagi sebelum booking dikirim.
                  </p>
                ) : null}
                </div>
              </FormField>
            </div>

            <FormField
              label="Catatan tambahan"
              htmlFor="notes"
              hint="Opsional"
              error={errors.notes?.message}
            >
              <TextareaControl
                id="notes"
                placeholder="Contoh: AC kamar kurang dingin, netes air, atau perlu cek freon"
                className="min-h-24"
                {...register("notes")}
              />
            </FormField>

            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
              {...register("website")}
            />
            <input
              type="hidden"
              value={submissionKey}
              {...register("submissionKey")}
            />
            <input type="hidden" value={startedAt} {...register("startedAt")} />
            <input type="hidden" {...register("mapsUrl")} />
            <input type="hidden" {...register("turnstileToken")} />
            <input type="hidden" {...register("latitude")} />
            <input type="hidden" {...register("longitude")} />
            <input type="hidden" {...register("timeSlot")} />

            {publicEnv.turnstileEnabled ? (
              <div
                ref={(node) => setFieldContainerRef("turnstileToken", node)}
                tabIndex={-1}
              >
                <FormField
                  label="Verifikasi"
                  htmlFor="turnstileToken"
                  error={errors.turnstileToken?.message}
                >
                  <TurnstileWidget
                    onTokenChange={(token) =>
                      form.setValue("turnstileToken", token, {
                        shouldValidate: true,
                      })
                    }
                  />
                </FormField>
              </div>
            ) : null}

            {errors.root?.message ? (
              <div className="rounded-[1.1rem] bg-destructive/8 px-4 py-3 text-[12px] leading-5 text-destructive ring-1 ring-destructive/12">
                {errors.root.message}
              </div>
            ) : null}

            {submitFeedback ? (
              <div className="rounded-[1.1rem] bg-emerald-50 px-4 py-3 text-[12px] leading-5 text-emerald-800 ring-1 ring-emerald-200/70">
                {submitFeedback}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-1 h-11 w-full rounded-full border-primary bg-primary text-[13px] font-medium text-white shadow-[0_14px_24px_-18px_rgba(0,81,162,0.28)] hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)] focus-visible:border-[color:var(--primary-hover)] focus-visible:ring-primary/18"
              disabled={isSubmitting || submitState === "submitting"}
            >
              {isSubmitting || submitState === "submitting" ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Mengirim pemesanan
                </>
              ) : (
                <>
                  Konfirmasi pemesanan
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </section>
      </section>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
        <section className="panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="section-kicker">Ringkasan booking</p>
            <h2 className="text-[1.12rem] font-medium leading-[1.2] text-foreground sm:text-[1.2rem]">
              Pastikan pilihan layanan sudah sesuai.
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            <div className="panel-soft px-4 py-3.5">
              <p className="text-[11px] leading-4 text-muted-foreground">Layanan</p>
              <p className="mt-1.5 text-[13px] font-medium leading-5 text-foreground">
                {serviceSummaryLabel}
              </p>
              {selectedServiceComplaint ? (
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  Detail: {selectedServiceComplaint}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="panel-soft px-4 py-3.5">
                <p className="text-[11px] leading-4 text-muted-foreground">Tanggal</p>
                <p className="mt-1.5 text-[13px] font-medium leading-5 text-foreground">
                  {selectedDate || "Belum dipilih"}
                </p>
              </div>
              <div className="panel-soft px-4 py-3.5">
                <p className="text-[11px] leading-4 text-muted-foreground">Waktu</p>
                <p className="mt-1.5 text-[13px] font-medium leading-5 text-foreground">
                  {slots.find((slot) => slot.value === selectedSlot)?.label || "Belum dipilih"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.65rem] border border-primary bg-primary p-5 text-white shadow-[0_14px_26px_-22px_rgba(0,81,162,0.24)] sm:p-6">
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] leading-4 text-white/70">
                  Bantuan cepat
                </p>
                <h2 className="mt-2 text-[1.18rem] font-medium leading-[1.18] tracking-[-0.01em] text-balance sm:text-[1.28rem]">
                  Butuh bantuan lebih cepat?
                </h2>
              </div>
              <div className="rounded-full border border-white/16 bg-white/12 p-3">
                <MessageCircleMore className="size-5" />
              </div>
            </div>

            <p className="mt-3 text-[12px] leading-5 text-white/82 sm:text-[13px] sm:leading-6">
              Untuk kendala mendesak atau perlu konsultasi singkat, hubungi kami langsung lewat WhatsApp.
            </p>

            <a
              href={quickHelpWhatsAppHref}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white bg-white px-4 text-[13px] font-medium text-primary transition hover:bg-[#f5faff]"
            >
              <PhoneCall className="size-4" />
              Chat WhatsApp
            </a>

            <div className="mt-5 rounded-[1.1rem] border border-white/14 bg-white/10 p-4">
              <p className="text-[11px] leading-4 text-white/66">
                Kontak cepat
              </p>
              <p className="mt-1.5 text-[13px] font-medium leading-5">{quickHelpWhatsAppNumber}</p>
            </div>
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <div className="space-y-2">
            <p className="section-kicker">Alur booking</p>
            <h2 className="text-[1.12rem] font-medium leading-[1.2] text-foreground sm:text-[1.2rem]">
              Langkahnya singkat dan mudah diikuti.
            </h2>
            <p className="text-[12px] leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
              Cukup pilih layanan, tentukan jadwal, lalu isi detail yang diperlukan.
            </p>
          </div>

          <div className="mt-5 space-y-2.5">
            <div className="panel-soft flex items-start gap-3 px-4 py-3.5">
              <div className="rounded-full bg-primary/8 p-2 text-primary">
                <CalendarDays className="size-4" />
              </div>
              <div>
                <p className="text-[12px] font-medium leading-5 text-foreground">Pilih tanggal kunjungan</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-[12px]">
                  Jadwal yang tersedia akan diperbarui otomatis sesuai tanggal yang dipilih.
                </p>
              </div>
            </div>
            <div className="panel-soft flex items-start gap-3 px-4 py-3.5">
              <div className="rounded-full bg-primary/8 p-2 text-primary">
                <Clock3 className="size-4" />
              </div>
              <div>
                <p className="text-[12px] font-medium leading-5 text-foreground">Pilih jam yang benar-benar tersedia</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-[12px]">
                  Slot yang sudah penuh tidak bisa dipilih, jadi proses booking lebih jelas.
                </p>
              </div>
            </div>
            <div className="panel-soft flex items-start gap-3 px-4 py-3.5">
              <div className="rounded-full bg-primary/8 p-2 text-primary">
                <Wind className="size-4" />
              </div>
              <div>
                <p className="text-[12px] font-medium leading-5 text-foreground">Tulis kebutuhan servis dengan singkat</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-[12px]">
                  Cukup jelaskan keluhan utama seperti kurang dingin, bocor, atau perlu cuci AC.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="panel-soft px-5 py-4 sm:px-6">
            <p className="text-[11px] leading-4 text-primary/80">
              Sebelum kirim
            </p>
            <div className="mt-3 space-y-2 text-[12px] leading-5 text-muted-foreground">
              <p>Pastikan nomor HP aktif agar teknisi mudah menghubungi Anda.</p>
              <p>Tambahkan patokan alamat jika lokasi servis agak sulit ditemukan.</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
