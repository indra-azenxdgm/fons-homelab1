import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getTimeSlotLabel } from "@/features/booking/constants";
import { buildPublicBookingServiceSummary } from "@/features/booking/lib/public-service-config";
import { cn } from "@/lib/utils";

type BookingSuccessProps = {
  booking?: {
    bookingCode: string;
    contactName: string;
    bookingDate: Date;
    timeSlot: string;
    serviceDisplayName: string | null;
    serviceVariant: string | null;
    serviceIssue: string | null;
    serviceComplaint: string | null;
    serviceType: {
      name: string;
    };
  } | null;
  bookingCode?: string;
};

function formatBookingDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function BookingSuccess({ booking, bookingCode }: BookingSuccessProps) {
  const code = booking?.bookingCode || bookingCode || "Menunggu konfirmasi";
  const serviceLabel = booking
    ? buildPublicBookingServiceSummary({
        serviceName: booking.serviceDisplayName || booking.serviceType.name,
        serviceVariant: booking.serviceVariant,
        repairIssue: booking.serviceIssue,
      })
    : null;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 pb-6 pt-4 font-sans sm:min-h-[calc(100vh-4.125rem)] sm:px-6 sm:pb-8 sm:pt-5">
      <section className="panel p-6 sm:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-emerald-100/90 text-emerald-600 shadow-[0_12px_30px_-22px_rgba(22,163,74,0.4)]">
            <CheckCircle2 className="size-8" />
          </div>
          <p className="mt-5 text-[11px] leading-4 text-emerald-700">
            Pemesanan berhasil dikirim
          </p>
          <h1 className="mt-3 text-[1.65rem] font-medium leading-[1.18] tracking-[-0.015em] text-balance sm:text-[1.9rem]">
            Terima kasih, booking Anda sudah kami terima.
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
            {siteConfig.name} akan mengecek detailnya lalu menghubungi Anda untuk konfirmasi jadwal.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-xl gap-4 rounded-[1.75rem] border border-emerald-200 bg-white p-5">
          <div>
            <p className="text-[11px] leading-4 text-muted-foreground">
              Kode booking
            </p>
            <p className="mt-2 text-[1.55rem] font-medium">{code}</p>
          </div>

          {booking ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="panel-soft p-4">
                <p className="text-[11px] text-muted-foreground">
                  Pelanggan
                </p>
                <p className="mt-2 text-[14px] font-medium">{booking.contactName}</p>
              </div>
              <div className="panel-soft p-4">
                <CalendarDays className="size-4 text-primary" />
                <p className="mt-2 text-[14px] font-medium">
                  {formatBookingDate(booking.bookingDate)}
                </p>
              </div>
              <div className="panel-soft p-4">
                <Clock3 className="size-4 text-primary" />
                <p className="mt-2 text-[14px] font-medium">{getTimeSlotLabel(booking.timeSlot)}</p>
              </div>
            </div>
          ) : null}

          {serviceLabel ? (
            <div className="panel-soft p-4 text-[14px] leading-5 text-muted-foreground">
              Layanan yang dipilih:{" "}
              <span className="font-medium text-foreground">{serviceLabel}</span>
              {booking?.serviceComplaint ? (
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                  Detail: <span className="font-medium text-foreground">{booking.serviceComplaint}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mx-auto mt-5 max-w-xl rounded-[1.35rem] bg-white/72 p-4 text-[13px] leading-5 text-muted-foreground ring-1 ring-black/6">
          Simpan kode booking ini. Tim kami akan menindaklanjuti tanpa perlu Anda mengisi data lagi.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/booking"
            className={cn(
              "inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-primary bg-primary px-5 text-[14px] font-medium text-white shadow-[0_14px_24px_-18px_rgba(0,81,162,0.28)] transition hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:translate-y-px",
            )}
          >
            Pesan servis lagi
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/"
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-full bg-white/75 px-5 text-[14px] font-medium text-foreground ring-1 ring-black/6 transition hover:bg-white",
            )}
          >
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
