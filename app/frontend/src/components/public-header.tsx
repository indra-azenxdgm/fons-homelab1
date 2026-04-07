"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageCircleMore } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const hiddenPrefixes = ["/admin"];

export function PublicHeader() {
  const pathname = usePathname();

  if (
    pathname === "/booking"
    || hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return null;
  }

  const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber.replace(/[^\d]/g, "")}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.125rem] sm:px-6">
        <Link
          href="/home"
          aria-label="Fon's"
          className={cn(
            "inline-flex h-10 items-center rounded-full px-1 transition hover:bg-primary/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          )}
        >
          <Image
            src="/fons-header.png"
            alt="Fon's"
            width={116}
            height={34}
            priority
            className="h-8 w-auto object-contain mix-blend-multiply sm:h-8.5"
          />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/72 p-1 text-[12px] font-medium text-muted-foreground shadow-[0_10px_24px_-22px_rgba(0,81,162,0.2)] md:flex">
            <Link
              href="/home#layanan"
              className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground"
            >
              Layanan
            </Link>
            <Link
              href="/home#alur-booking"
              className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground"
            >
              Alur
            </Link>
            <Link
              href="/home#faq"
              className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground"
            >
              FAQ
            </Link>
          </nav>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="hidden h-10 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-[13px] font-medium text-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary sm:inline-flex"
          >
            <MessageCircleMore className="size-4 text-primary" />
            WhatsApp
          </a>

          <Link
            href="/booking"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-[13px] font-medium text-white shadow-[0_14px_26px_-18px_rgba(0,81,162,0.32)] transition hover:bg-[color:var(--primary-hover)]"
          >
            Booking
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
