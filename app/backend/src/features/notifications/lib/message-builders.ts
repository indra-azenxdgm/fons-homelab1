import type {
  NotificationDispatchInput,
  NotificationMessage,
  NotificationTarget,
} from "@/features/notifications/lib/types";
import {
  buildBookingReminderTemplate,
  buildCustomerBookingConfirmationTemplate,
  buildOwnerBookingNotificationTemplate,
} from "@/features/notifications/lib/templates/whatsapp-templates";

function buildEmailFallbackMessage(
  input: NotificationDispatchInput,
  target: NotificationTarget,
): NotificationMessage {
  return {
    channel: "email",
    templateKey: `email_${input.eventType.replaceAll(".", "_")}`,
    content: {
      title: `Fon's booking update: ${input.payload.bookingCode}`,
      body: `${input.payload.customerName}, your booking ${input.payload.bookingCode} is linked to ${input.payload.serviceTypeName} on ${input.payload.timeSlot}.`,
      variables: {
        recipient: target.recipient,
        booking_code: input.payload.bookingCode,
      },
    },
  };
}

export function buildNotificationMessage(
  input: NotificationDispatchInput,
  target: NotificationTarget,
): NotificationMessage {
  if (target.channel === "email") {
    return buildEmailFallbackMessage(input, target);
  }

  if (target.role === "admin") {
    return buildOwnerBookingNotificationTemplate(input.payload);
  }

  switch (input.eventType) {
    case "booking.created":
    case "booking.confirmed":
      return buildCustomerBookingConfirmationTemplate(input.payload);
    case "booking.canceled":
      return buildOwnerBookingNotificationTemplate(input.payload);
    case "booking.reminder":
      return buildBookingReminderTemplate(input.payload);
    default:
      return buildOwnerBookingNotificationTemplate(input.payload);
  }
}
