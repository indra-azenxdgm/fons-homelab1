"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminAssignedSquads } from "@/features/admin/components/admin-assigned-squads";
import { AdminBookingUpdateForm } from "@/features/admin/components/admin-booking-update-form";
import { BookingStatusBadge } from "@/features/admin/components/booking-status-badge";
import {
  getAdminBookingBaseServiceLabel,
  getAdminBookingExtraServiceLabel,
  getAdminBookingServiceDisplayLabel,
} from "@/features/admin/lib/shared/admin-booking-service-display";
import type { AdminBookingDetail } from "@/features/admin/lib/shared/admin-booking-types";
import { getTimeSlotLabel } from "@/features/booking/constants";
import { cn } from "@/lib/utils";

type AdminBookingDetailViewProps = {
  booking: AdminBookingDetail;
  canUpdateBooking: boolean;
  squads: Array<{
    id: string;
    name: string;
    alias: string;
  }>;
  statusOptions: string[];
  layout?: "page" | "drawer";
};

function renderAddress(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function AdminBookingDetailView({
  booking,
  canUpdateBooking,
  squads,
  statusOptions,
  layout = "page",
}: AdminBookingDetailViewProps) {
  const [currentBooking, setCurrentBooking] = useState(booking);
  const isDrawer = layout === "drawer";
  const summaryMaxVisible = Math.max(1, currentBooking.assignedSquads.length);
  const serviceBaseLabel = getAdminBookingBaseServiceLabel(currentBooking);
  const serviceExtraLabel = getAdminBookingExtraServiceLabel(currentBooking);
  const serviceDisplayLabel = getAdminBookingServiceDisplayLabel(currentBooking);
  const readonlySectionClass = isDrawer
    ? "rounded-[1.28rem] border border-[#D8E7F5] bg-[#F7FBFF] p-3.5"
    : "panel p-5";
  const readonlyCardClass = isDrawer
    ? "rounded-[1rem] border border-[#D8E7F5] bg-white/84 p-2.5"
    : "rounded-[1.05rem] border border-[#D8E7F5] bg-[#F7FBFF] p-4";
  const readonlyActivityItemClass = isDrawer
    ? "rounded-[1rem] border border-[#D8E7F5] bg-[#F7FBFF] p-3"
    : "rounded-[1rem] border border-[#D8E7F5] bg-[#F7FBFF] p-4";
  const drawerMetaLabelClassName =
    "admin-kicker-label";
  const drawerMetaValueClassName = "mt-1 text-[11px] font-medium leading-4 text-foreground";
  const updateSection = canUpdateBooking ? (
    <AdminBookingUpdateForm
      bookingId={currentBooking.id}
      currentStatus={currentBooking.status}
      currentAssignedSquadIds={currentBooking.assignedSquads.map((squad) => squad.id)}
      statusOptions={statusOptions}
      squads={squads}
      onUpdated={setCurrentBooking}
      layout={isDrawer ? "drawer" : "sidebar"}
    />
  ) : (
    <div className={readonlySectionClass}>
      <h2 className="admin-card-title">Booking updates restricted</h2>
      <p className="admin-meta-text mt-1.5">
        Your account can view booking details but cannot change booking status or
        assignment.
      </p>
    </div>
  );

  return (
    <section className={isDrawer ? "space-y-3" : "grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"}>
      <div className="space-y-3">
        {isDrawer ? updateSection : null}

        {!isDrawer ? (
          <div className="panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href="/admin/bookings"
                  className="text-[12px] leading-5 text-muted-foreground hover:text-foreground"
                >
                  Back to bookings
                </Link>
                <h1 className="admin-page-title mt-2 !text-[1.45rem] sm:!text-[1.7rem]">
                  {currentBooking.bookingCode}
                </h1>
                <p className="admin-page-copy mt-1">
                  Created {formatAdminDate(currentBooking.createdAt)}
                </p>
              </div>
              <BookingStatusBadge status={currentBooking.status} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className={readonlyCardClass}>
                <p className="admin-kicker-label">
                  Booking date
                </p>
                <p className="mt-2 text-[12px] font-medium leading-5">
                  {formatAdminDate(currentBooking.bookingDate)}
                </p>
              </div>
              <div className={readonlyCardClass}>
                <p className="admin-kicker-label">
                  Time slot
                </p>
                <p className="mt-2 text-[12px] font-medium leading-5">
                  {getTimeSlotLabel(currentBooking.timeSlot)}
                </p>
              </div>
              <div className={readonlyCardClass}>
                <p className="admin-kicker-label">
                  Service type
                </p>
                <p className="mt-2 text-[12px] font-medium leading-5">{serviceDisplayLabel}</p>
              </div>
              <div className={readonlyCardClass}>
                <p className="admin-kicker-label">
                  Assigned squads
                </p>
                <div className="mt-2">
                  <AdminAssignedSquads
                    squads={currentBooking.assignedSquads}
                    variant="chips"
                    maxVisible={summaryMaxVisible}
                    aliasOnly
                    className="gap-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={readonlySectionClass}>
            <div className="grid grid-cols-2 gap-2">
              <div className={readonlyCardClass}>
                <p className={drawerMetaLabelClassName}>
                  Booking date
                </p>
                <p className={drawerMetaValueClassName}>
                  {formatAdminDate(currentBooking.bookingDate)}
                </p>
              </div>
              <div className={readonlyCardClass}>
                <p className={drawerMetaLabelClassName}>
                  Time slot
                </p>
                <p className={drawerMetaValueClassName}>
                  {getTimeSlotLabel(currentBooking.timeSlot)}
                </p>
              </div>
              <div className={readonlyCardClass}>
                <p className={drawerMetaLabelClassName}>
                  Service type
                </p>
                <p className={drawerMetaValueClassName}>{serviceDisplayLabel}</p>
              </div>
              <div className={readonlyCardClass}>
                <p className={drawerMetaLabelClassName}>
                  Assigned squads
                </p>
                <div className="mt-1.5">
                  <AdminAssignedSquads
                    squads={currentBooking.assignedSquads}
                    variant="chips"
                    maxVisible={summaryMaxVisible}
                    aliasOnly
                    className="gap-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={readonlySectionClass}>
          <h2 className={cn(isDrawer ? "admin-card-title" : "admin-section-title")}>Customer details</h2>
          <div
            className={cn(
              "mt-3 grid gap-x-2 gap-y-3",
              isDrawer ? "grid-cols-2" : "sm:grid-cols-2",
            )}
          >
            <div>
              <p className={cn("admin-kicker-label")}>
                Name
              </p>
              <p className={cn(isDrawer ? "mt-1 text-[11px] font-medium leading-4" : "mt-2 text-[12px] font-medium leading-5")}>{currentBooking.contactName}</p>
            </div>
            <div>
              <p className="admin-kicker-label">
                Phone
              </p>
              <p className={cn(isDrawer ? "mt-1 text-[11px] font-medium leading-4" : "mt-2 text-[12px] font-medium leading-5")}>{currentBooking.contactPhone}</p>
            </div>
            <div>
              <p className="admin-kicker-label">
                Email
              </p>
              <p className={cn(isDrawer ? "mt-1 text-[11px] font-medium leading-4" : "mt-2 text-[12px] font-medium leading-5")}>
                {currentBooking.contactEmail || "Not provided"}
              </p>
            </div>
            <div>
              <p className="admin-kicker-label">
                Customer record
              </p>
              <p className={cn(isDrawer ? "mt-1 text-[11px] font-medium leading-4" : "mt-2 text-[12px] font-medium leading-5")}>{currentBooking.customer.fullName}</p>
            </div>
            <div className={isDrawer ? "col-span-2" : "sm:col-span-2"}>
              <p className="admin-kicker-label">
                Address
              </p>
              <p className={cn(isDrawer ? "mt-1 text-[11px] font-medium leading-4" : "mt-1.5 text-[11px] font-medium leading-4")}>
                {renderAddress([
                  currentBooking.addressLine1,
                  currentBooking.addressLine2,
                  currentBooking.district,
                  currentBooking.city,
                  currentBooking.province,
                  currentBooking.postalCode,
                ])}
              </p>
            </div>
            <div className={isDrawer ? "col-span-2" : "sm:col-span-2"}>
              <p className="admin-kicker-label">
                Service details
              </p>
              <div
                className={cn(
                  "mt-2.5 rounded-[1.15rem] border px-4 py-4 shadow-[0_18px_34px_-28px_rgba(0,81,162,0.28)]",
                  isDrawer
                    ? "border-primary/18 bg-[linear-gradient(180deg,rgba(238,247,255,0.95)_0%,rgba(247,251,255,0.98)_100%)]"
                    : "border-primary/16 bg-[linear-gradient(180deg,rgba(238,247,255,0.92)_0%,rgba(247,251,255,0.98)_100%)]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/75">
                  Operational Summary
                </p>
                <p className={cn("mt-2 font-semibold tracking-[-0.01em] text-foreground", isDrawer ? "text-[13px] leading-5" : "text-[14px] leading-5")}>
                  {serviceDisplayLabel}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-primary/14 bg-white/88 px-3 py-1.5 text-[11px] font-medium leading-4 text-foreground">
                    Layanan: {serviceBaseLabel}
                  </span>
                  {serviceExtraLabel ? (
                    <span className="inline-flex rounded-full border border-primary/14 bg-primary/8 px-3 py-1.5 text-[11px] font-medium leading-4 text-primary">
                      Detail utama: {serviceExtraLabel}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-1.5 text-[11px] leading-4">
                  {currentBooking.serviceVariant ? (
                    <p className="text-muted-foreground">Tipe AC: <span className="font-medium text-foreground">{currentBooking.serviceVariant}</span></p>
                  ) : null}
                  {currentBooking.serviceIssue ? (
                    <p className="text-muted-foreground">Kendala: <span className="font-medium text-foreground">{currentBooking.serviceIssue}</span></p>
                  ) : null}
                  {currentBooking.serviceComplaint ? (
                    <p className="text-muted-foreground">Keterangan: <span className="font-medium text-foreground">{currentBooking.serviceComplaint}</span></p>
                  ) : null}
                  {!currentBooking.serviceVariant && !currentBooking.serviceIssue && !currentBooking.serviceComplaint ? (
                    <p className="text-muted-foreground">Tidak ada detail layanan tambahan pada booking ini.</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className={isDrawer ? "col-span-2" : "sm:col-span-2"}>
              <p className="admin-kicker-label">
                Notes
              </p>
              <p className={cn(isDrawer ? "mt-1 text-[11px] text-foreground leading-4" : "mt-1.5 text-[11px] text-foreground leading-4")}>
                {currentBooking.notes || "No notes added"}
              </p>
            </div>
          </div>
        </div>

        <div className={readonlySectionClass}>
          <h2 className={cn(isDrawer ? "admin-card-title" : "admin-section-title")}>Recent activity</h2>
          <div className="mt-3 space-y-2">
            {currentBooking.logs.length ? (
              currentBooking.logs.map((log) => (
                <div key={log.id} className={readonlyActivityItemClass}>
                  <p className={cn(isDrawer ? "text-[11px] font-medium leading-4" : "text-[11px] font-medium leading-4")}>{log.action.replaceAll("_", " ")}</p>
                  <p className={cn(isDrawer ? "mt-1 text-[11px] text-muted-foreground leading-4" : "mt-1 text-[11px] text-muted-foreground leading-4")}>
                    {log.note || "No note"}
                  </p>
                  <p className={cn(isDrawer ? "mt-1.5 text-[10px] leading-4 text-muted-foreground" : "mt-1.5 text-[10px] leading-4 text-muted-foreground")}>
                    {formatAdminDate(log.createdAt)}
                    {log.fromStatus || log.toStatus
                      ? ` | ${log.fromStatus || "none"} -> ${log.toStatus || "none"}`
                      : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className={cn(isDrawer ? "text-[11px] leading-4 text-muted-foreground" : "text-[11px] leading-4 text-muted-foreground")}>No activity yet.</p>
            )}
          </div>
        </div>
      </div>

      {!isDrawer ? <div>{updateSection}</div> : null}
    </section>
  );
}
