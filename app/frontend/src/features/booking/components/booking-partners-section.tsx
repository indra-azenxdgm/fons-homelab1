import Image from "next/image";

import { PARTNER_LOGOS } from "@/features/booking/lib/partner-logos";

export function BookingPartnersSection() {
  return (
    <section className="mt-5 panel p-5 sm:p-6">
      <div className="max-w-2xl space-y-2">
        <p className="section-kicker">Partner Kami</p>
        <h2 className="text-[1.2rem] font-medium leading-[1.2] text-foreground sm:text-[1.3rem]">
          Dipercaya oleh berbagai partner untuk kebutuhan perawatan AC.
        </h2>
        <p className="text-[12px] leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
          Beberapa partner yang sudah mempercayakan layanan servis dan perawatan AC bersama Fon&apos;s.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {PARTNER_LOGOS.map((logo) => (
          <div
            key={logo.src}
            className="flex h-24 items-center justify-center rounded-[1.2rem] border border-border/80 bg-white/84 px-4 py-4 shadow-[0_10px_20px_-20px_rgba(0,81,162,0.1)] sm:h-28 sm:px-5"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              unoptimized
              className="max-h-12 w-auto max-w-full object-contain sm:max-h-14"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
