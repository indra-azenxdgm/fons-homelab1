import type {
  NotificationChannel,
  NotificationProvider,
  NotificationProviderResult,
} from "@/features/notifications/lib/types";

export class WhatsAppProvider implements NotificationProvider {
  name = "whatsapp_business_api";

  supports(channel: NotificationChannel) {
    return channel === "whatsapp";
  }

  async send(): Promise<NotificationProviderResult> {
    throw new Error(
      "WhatsApp provider is not implemented yet. Configure a supported provider adapter before enabling it.",
    );
  }
}
