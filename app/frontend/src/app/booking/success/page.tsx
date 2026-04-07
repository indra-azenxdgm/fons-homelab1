import type { Metadata } from "next";

import { BookingSuccess } from "@/features/booking/components/booking-success";
import { getBookingByCode } from "@/features/booking/lib/booking-service";

export const metadata: Metadata = {
  title: "Booking Terkirim | Fon's",
  robots: {
    index: false,
    follow: false,
  },
};

type SuccessPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function BookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { code } = await searchParams;
  const booking = code ? await getBookingByCode(code) : null;

  return <BookingSuccess booking={booking} bookingCode={code} />;
}
