import type {
  NotificationEventPayload,
  NotificationMessage,
} from "@/features/notifications/lib/types";
import { formatNotificationDate } from "@/features/notifications/lib/format";

function getCommonVariables(payload: NotificationEventPayload) {
  return {
    customer_name: payload.customerName,
    booking_code: payload.bookingCode,
    booking_date: formatNotificationDate(payload.bookingDate),
    booking_time_slot: payload.timeSlot,
    service_type: payload.serviceTypeName,
  };
}

export function buildCustomerBookingConfirmationTemplate(
  payload: NotificationEventPayload,
): NotificationMessage {
  return {
    channel: "whatsapp",
    templateKey: "customer_booking_confirmation",
    content: {
      title: "Booking Confirmed",
      body:
        "Hi {{customer_name}}, your Fon's booking {{booking_code}} is confirmed for {{booking_date}} at {{booking_time_slot}}.",
      variables: getCommonVariables(payload),
    },
  };
}

export function buildOwnerBookingNotificationTemplate(
  payload: NotificationEventPayload,
): NotificationMessage {
  return {
    channel: "whatsapp",
    templateKey: "owner_booking_notification",
    content: {
      title: "New Booking Alert",
      body:
        "New booking {{booking_code}} from {{customer_name}} for {{service_type}} on {{booking_date}} at {{booking_time_slot}}.",
      variables: getCommonVariables(payload),
    },
  };
}

export function buildBookingReminderTemplate(
  payload: NotificationEventPayload,
): NotificationMessage {
  return {
    channel: "whatsapp",
    templateKey: "booking_reminder",
    content: {
      title: "Booking Reminder",
      body:
        "Reminder: booking {{booking_code}} is scheduled for {{booking_date}} at {{booking_time_slot}}.",
      variables: getCommonVariables(payload),
    },
  };
}
