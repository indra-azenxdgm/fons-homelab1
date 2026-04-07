import type {
  NotificationProvider,
  NotificationProviderResult,
} from "@/features/notifications/lib/types";

export class StubNotificationProvider implements NotificationProvider {
  name = "stub";

  supports() {
    return true;
  }

  async send(input: {
    eventType: "booking.created" | "booking.confirmed" | "booking.canceled" | "booking.reminder";
    target: { role: "customer" | "admin"; channel: "whatsapp" | "email"; recipient: string };
    payload: {
      bookingId: string;
      bookingCode: string;
      customerName: string;
      phone: string;
      email?: string | null;
      bookingDate: Date;
      timeSlot: string;
      serviceTypeName: string;
    };
    message: {
      channel: "whatsapp" | "email";
      templateKey: string;
      content: {
        title: string;
        body: string;
        variables: Record<string, string>;
      };
    };
  }): Promise<NotificationProviderResult> {
    console.info("[notification:stub]", {
      eventType: input.eventType,
      channel: input.target.channel,
      recipient: input.target.recipient,
      bookingCode: input.payload.bookingCode,
      templateKey: input.message.templateKey,
      variables: input.message.content.variables,
    });

    return {
      success: true,
      provider: this.name,
    };
  }
}
