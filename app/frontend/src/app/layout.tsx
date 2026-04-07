import type { Metadata } from "next";
import { Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";

import { AppToastViewport } from "@/components/app-toast-viewport";
import { PublicHeader } from "@/components/public-header";
import { siteConfig } from "@/config/site";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Fon's | Pesan Servis AC",
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Fon's | Pesan Servis AC",
    description: siteConfig.description,
    images: ["/fons.png"],
  },
  twitter: {
    card: "summary",
    title: "Fon's | Pesan Servis AC",
    description: siteConfig.description,
    images: ["/fons.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/fons.png",
    shortcut: "/fons.png",
    apple: "/fons.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${openSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AppToastViewport />
        <PublicHeader />
        {children}
      </body>
    </html>
  );
}
