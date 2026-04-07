import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Droplets,
  MessageCircleMore,
  ShieldCheck,
  Snowflake,
  Store,
  WrenchIcon,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Cuci AC",
    description: "Bersih rutin supaya AC tetap dingin dan aliran udara lancar.",
    icon: Droplets,
  },
  {
    title: "Pembelian dan pasang AC Baru",
    description: "Bantu pilih unit baru dan pasang rapi untuk rumah, kos, kantor, atau usaha.",
    icon: Building2,
  },
  {
    title: "Jasa Pasang AC",
    description: "Pemasangan AC dengan pengerjaan rapi dan penempatan yang sesuai kebutuhan ruangan.",
    icon: Snowflake,
  },
  {
    title: "Bongkar Pasang AC",
    description: "Bongkar lalu pasang kembali AC dengan proses aman saat pindah titik atau lokasi.",
    icon: Store,
  },
  {
    title: "Bongkar AC",
    description: "Lepas unit AC secara aman untuk relokasi, renovasi, atau penggantian perangkat.",
    icon: WrenchIcon,
  },
  {
    title: "Perbaikan",
    description: "Troubleshooting AC bocor, mati, berisik, atau tidak dingin.",
    icon: ShieldCheck,
  },
];

const trustPoints = [
  "Teknisi berpengalaman dan kerja rapi.",
  "Bisa untuk rumah, kos, kantor, dan usaha.",
  "Area layanan Yogyakarta, Sleman, Bantul, dan Kulon Progo.",
  "Booking dari web atau langsung lewat WhatsApp.",
];

const heroTags = [
  "Cuci AC",
  "Pembelian dan pasang AC Baru",
  "Jasa Pasang AC",
  "Bongkar Pasang AC",
  "Bongkar AC",
  "Perbaikan",
];

const coverageTags = ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo"];

const faqs = [
  {
    question: "Area layanannya di mana?",
    answer: `Fon's melayani area ${siteConfig.city}, Sleman, Bantul, dan Kulon Progo. Untuk titik di luar area tersebut, bisa konfirmasi dulu lewat WhatsApp.`,
  },
  {
    question: "Bisa booking di hari yang sama?",
    answer: "Bisa jika slot masih tersedia. Cek jadwal di halaman booking atau chat dulu untuk kebutuhan yang lebih mendesak.",
  },
  {
    question: "Jam operasionalnya bagaimana?",
    answer: "Untuk jadwal kunjungan, cek slot yang tersedia di halaman booking atau konfirmasi langsung lewat WhatsApp.",
  },
  {
    question: "Kalau lebih nyaman lewat WhatsApp bisa?",
    answer: "Bisa. Kalau ingin tanya dulu atau order lebih cepat, langsung chat WhatsApp saja.",
  },
];

export function HomePage() {
  const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber.replace(/[^\d]/g, "")}`;

  return (
    <main className="landing-shell font-sans">
      <section className="landing-hero panel overflow-hidden">
        <div className="grid gap-7 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-10">
          <div className="flex flex-col">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-primary/8 px-3 py-1.5 text-[11px] font-semibold text-primary">
              <Snowflake className="size-3.5" />
              Service & cuci AC Jogja
            </div>

            <div className="mt-5">
              <Image
                src="/fons-header.png"
                alt="Fon's"
                width={128}
                height={38}
                priority
                className="h-8 w-auto object-contain"
              />
            </div>

            <div className="mt-5 space-y-4">
              <h1 className="max-w-2xl text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance sm:text-[2.5rem]">
                Jasa Service dan Cuci AC Jogja
              </h1>
              <div className="max-w-xl space-y-1 text-[14px] leading-6 text-muted-foreground">
                <p>Rumah, Kantor, Kos dan Ruang Usaha.</p>
                <p>Teknisi berpengalaman, edukatif dan jujur.</p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[14px] font-medium text-primary-foreground shadow-[0_18px_30px_-18px_rgba(0,81,162,0.34)] transition hover:-translate-y-0.5 hover:bg-[color:var(--primary-hover)]",
                )}
              >
                Booking Sekarang
                <ArrowRight className="size-4" />
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-white px-6 text-[14px] font-medium text-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary"
              >
                <MessageCircleMore className="size-4" />
                Chat WhatsApp
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {heroTags.map((item) => (
                <div key={item} className="panel-soft px-4 py-3 text-[12px] leading-5 text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.85rem] bg-[linear-gradient(180deg,#0d5aa8_0%,#1f78c6_100%)] p-5 text-white shadow-[0_18px_36px_-24px_rgba(0,81,162,0.38)] sm:col-span-2 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/68">Layanan Fon&apos;s</p>
              <h2 className="mt-3 text-[1.3rem] font-semibold leading-[1.15]">
                Jasa service dan cuci AC untuk area Jogja.
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-white/14 bg-white/10 p-4">
                  <p className="text-[11px] text-white/68">Layanan</p>
                  <p className="mt-2 text-[14px] font-medium">Cuci, pasang, bongkar, perbaikan</p>
                </div>
                <div className="rounded-[1.35rem] border border-white/14 bg-white/10 p-4">
                  <p className="text-[11px] text-white/68">Area</p>
                  <p className="mt-2 text-[14px] font-medium">Yogyakarta, Sleman, Bantul, Kulon Progo</p>
                </div>
                <div className="rounded-[1.35rem] border border-white/14 bg-white/10 p-4">
                  <p className="text-[11px] text-white/68">Kontak</p>
                  <p className="mt-2 text-[14px] font-medium">{siteConfig.whatsappNumber}</p>
                </div>
              </div>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-medium text-primary transition hover:bg-[#eef7ff]"
              >
                <MessageCircleMore className="size-4" />
                Chat WhatsApp
              </a>
            </div>

            <div className="panel p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">Area cakupan</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {coverageTags.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-[12px] font-medium text-secondary-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">Area layanan</p>
              <p className="mt-4 text-[13px] leading-6 text-muted-foreground">
                Layanan tersedia untuk {siteConfig.city}, Sleman, Bantul, dan Kulon Progo. Kalau titik servis berada di luar area tersebut, silakan konfirmasi dulu lewat WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="layanan" className="mt-5 space-y-4">
        <div className="max-w-2xl space-y-2">
          <p className="section-kicker">Layanan unggulan</p>
          <h2 className="section-title">Layanan utama untuk kebutuhan AC sehari-hari.</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article key={service.title} className="panel p-5">
                <div className="flex size-11 items-center justify-center rounded-[1rem] bg-secondary text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-[1rem] font-semibold leading-5 text-foreground">{service.title}</h3>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{service.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="kenapa-fons" className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5 sm:p-6">
          <p className="section-kicker">Kenapa pilih Fon&apos;s</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
            Cocok untuk kebutuhan service AC rumah sampai usaha.
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {trustPoints.map((item) => (
            <div key={item} className="panel-soft flex gap-3 px-4 py-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-[13px] leading-5 text-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#0d5aa8_0%,#2784d4_100%)] p-5 text-white shadow-[0_18px_36px_-26px_rgba(0,81,162,0.38)] sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">Bantuan cepat</p>
          <h2 className="mt-3 text-[1.45rem] font-semibold leading-[1.18] tracking-[-0.02em]">
            Butuh tanya atau mau langsung order?
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-6 text-white/82">
            Langsung chat WhatsApp untuk konsultasi singkat, atau lanjut booking untuk pilih layanan dan jadwal.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-medium text-primary transition hover:bg-[#eef7ff]"
            >
              <MessageCircleMore className="size-4" />
              Chat WhatsApp
            </a>
            <Link
              href="/booking"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/22 bg-white/10 px-5 text-[14px] font-medium text-white transition hover:bg-white/14"
            >
              Booking Sekarang
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 inline-flex rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[12px] text-white/82">
            WhatsApp aktif: {siteConfig.whatsappNumber}
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="section-kicker">Cara order</p>
          <h2 className="mt-2 text-[1.2rem] font-semibold leading-[1.2] text-foreground">
            Pilih layanan, tentukan jadwal, lalu teknisi datang.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {["Pilih layanan", "Tentukan jadwal", "Teknisi datang"].map((item, index) => (
              <div key={item} className="panel-soft flex items-center gap-3 px-4 py-4">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">
                  0{index + 1}
                </span>
                <p className="text-[13px] font-medium leading-5 text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mt-5 panel p-5 sm:p-6">
        <div className="max-w-2xl space-y-2">
          <p className="section-kicker">FAQ mini</p>
          <h2 className="section-title">Jawaban singkat sebelum booking.</h2>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="panel-soft px-4 py-4">
              <h3 className="text-[14px] font-semibold leading-5 text-foreground">{faq.question}</h3>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Siap order</p>
            <h2 className="mt-2 text-[1.35rem] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
              Booking service AC atau langsung chat WhatsApp.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/booking"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[14px] font-medium text-white transition hover:bg-[color:var(--primary-hover)]"
            >
              Booking Sekarang
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-[14px] font-medium text-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary"
            >
              <MessageCircleMore className="size-4 text-primary" />
              Chat WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="mt-8 border-t border-border/50 px-4 py-6 text-center sm:px-6 sm:py-7">
        <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">
          Developed by Azenx Digital Mandiri
        </p>
      </footer>
    </main>
  );
}
