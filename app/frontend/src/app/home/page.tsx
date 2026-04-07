import type { Metadata } from "next";

import { HomePage } from "@/features/home/components/home-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  alternates: {
    canonical: "/home",
  },
  openGraph: {
    url: `${siteConfig.url}/home`,
  },
  twitter: {
    title: "Fon's | Pesan Servis AC",
    description: siteConfig.description,
  },
};

export default function PublicHomePage() {
  return <HomePage />;
}
