export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { BookingForm } from "@/features/booking/components/booking-form";
import {
  getBookingFormData,
} from "@/features/booking/lib/booking-service";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Booking Servis AC | Fon's",
  description: "Form booking servis AC Fon's untuk rumah dan usaha kecil di Yogyakarta.",
  alternates: {
    canonical: "/booking",
  },
  openGraph: {
    url: `${siteConfig.url}/booking`,
    title: "Booking Servis AC | Fon's",
    description: "Form booking servis AC Fon's untuk rumah dan usaha kecil di Yogyakarta.",
  },
};

async function loadBookingPageData() {
  try {
    return {
      bookingFormData: await getBookingFormData(),
      loadError: null,
    };
  } catch (error) {
    console.error("[booking] failed to load initial form data", error);

    return {
      bookingFormData: null,
      loadError: "The booking service is temporarily unavailable. Refresh this page in a moment after the backend is healthy again.",
    };
  }
}

export default async function BookingPage() {
  const { bookingFormData, loadError } = await loadBookingPageData();

  if (loadError || !bookingFormData) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Booking unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">We couldn&apos;t load the booking form.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {loadError}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col overflow-x-clip px-4 pb-8 pt-4 font-sans sm:px-6 sm:pb-10 sm:pt-5">
      <div className="flex-1">
        <BookingForm
          serviceTypes={bookingFormData.serviceTypes}
          defaultDate={bookingFormData.defaultDate}
          initialSlots={bookingFormData.initialSlots}
        />
      </div>
      <footer className="mt-8 border-t border-border/50 px-2 py-6 text-center sm:px-6 sm:py-7">
        <p className="text-[11px] leading-5 text-muted-foreground sm:text-xs">
          Developed by Azenx Digital Mandiri
        </p>
      </footer>
    </main>
  );
}
