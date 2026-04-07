import { publicEnv } from "@/lib/env";

export const siteConfig = {
  name: publicEnv.appName,
  description: "Pemesanan servis AC yang cepat dan tepercaya untuk rumah dan usaha kecil.",
  city: publicEnv.city,
  whatsappNumber: publicEnv.whatsappNumber,
  url: publicEnv.siteUrl,
  roadmap: [
    "Alur pemesanan",
    "Dashboard admin",
    "CRM",
    "Perlindungan anti-spam",
    "Notifikasi WhatsApp",
  ],
} as const;
