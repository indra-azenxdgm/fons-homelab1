import { Prisma } from "@prisma/client";

import { db } from "@/lib/prisma";
import { StubNotificationProvider } from "@/features/notifications/lib/providers/stub-provider";
import { WhatsAppProvider } from "@/features/notifications/lib/providers/whatsapp-provider";
import { buildNotificationMessage } from "@/features/notifications/lib/message-builders";
import type {
  NotificationDispatchInput,
  NotificationChannel,
  NotificationProvider,
  NotificationTarget,
} from "@/features/notifications/lib/types";

function isFeatureEnabled(flag: string) {
  return process.env[flag] === "true";
}

function getProvider(channel: NotificationChannel): NotificationProvider {
  if (channel === "whatsapp" && isFeatureEnabled("WHATSAPP_NOTIFICATIONS_ENABLED")) {
    return new WhatsAppProvider();
  }

  return new StubNotificationProvider();
}

function getTargets(input: NotificationDispatchInput): NotificationTarget[] {
  const targets: NotificationTarget[] = [];
  const adminWhatsappNumber = process.env.WHATSAPP_ADMIN_RECIPIENT || "";
  const adminEmail = process.env.NOTIFICATION_ADMIN_EMAIL || "";

  if (
    input.payload.phone &&
    (input.eventType === "booking.confirmed" ||
      input.eventType === "booking.reminder" ||
      input.eventType === "booking.canceled")
  ) {
    targets.push({
      role: "customer",
      channel: "whatsapp",
      recipient: input.payload.phone,
    });
  }

  if (
    input.payload.email &&
    (input.eventType === "booking.confirmed" ||
      input.eventType === "booking.reminder" ||
      input.eventType === "booking.canceled")
  ) {
    targets.push({
      role: "customer",
      channel: "email",
      recipient: input.payload.email,
    });
  }

  if (adminWhatsappNumber && input.eventType === "booking.created") {
    targets.push({
      role: "admin",
      channel: "whatsapp",
      recipient: adminWhatsappNumber,
    });
  }

  if (adminEmail && input.eventType === "booking.created") {
    targets.push({
      role: "admin",
      channel: "email",
      recipient: adminEmail,
    });
  }

  return targets;
}

async function createNotificationLog(input: {
  bookingId: string;
  eventType: string;
  channel: string;
  provider: string;
  recipient: string;
  status: string;
  errorMessage?: string;
  payload: Record<string, unknown>;
}) {
  await db.notificationLog.create({
    data: {
      bookingId: input.bookingId,
      eventType: input.eventType,
      channel: input.channel,
      provider: input.provider,
      recipient: input.recipient,
      status: input.status,
      errorMessage: input.errorMessage || null,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}

export async function dispatchNotificationEvent(input: NotificationDispatchInput) {
  const targets = getTargets(input);

  if (targets.length === 0) {
    const provider = new StubNotificationProvider();
    await createNotificationLog({
      bookingId: input.payload.bookingId,
      eventType: input.eventType,
      channel: "none",
      provider: provider.name,
      recipient: "unavailable",
      status: "skipped",
      errorMessage: "No eligible notification target found",
      payload: {
        bookingCode: input.payload.bookingCode,
        serviceTypeName: input.payload.serviceTypeName,
      },
    });

    return;
  }

  await Promise.all(
    targets.map(async (target) => {
      const provider = getProvider(target.channel);
      const message = buildNotificationMessage(input, target);

      if (!provider.supports(target.channel)) {
        await createNotificationLog({
          bookingId: input.payload.bookingId,
          eventType: input.eventType,
          channel: target.channel,
          provider: provider.name,
          recipient: target.recipient,
          status: "skipped",
          errorMessage: `Provider ${provider.name} does not support ${target.channel}`,
          payload: {
            bookingCode: input.payload.bookingCode,
            templateKey: message.templateKey,
          },
        });

        return;
      }

      try {
        const result = await provider.send({
          eventType: input.eventType,
          target,
          payload: input.payload,
          message,
        });

        await createNotificationLog({
          bookingId: input.payload.bookingId,
          eventType: input.eventType,
          channel: target.channel,
          provider: result.provider,
          recipient: target.recipient,
          status: result.success ? "sent" : "failed",
          errorMessage: result.errorMessage,
          payload: {
            bookingCode: input.payload.bookingCode,
            externalId: result.externalId || null,
            templateKey: message.templateKey,
            targetRole: target.role,
            variables: message.content.variables,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Notification dispatch failed";

        await createNotificationLog({
          bookingId: input.payload.bookingId,
          eventType: input.eventType,
          channel: target.channel,
          provider: provider.name,
          recipient: target.recipient,
          status: "failed",
          errorMessage,
          payload: {
            bookingCode: input.payload.bookingCode,
            templateKey: message.templateKey,
            targetRole: target.role,
          },
        });
      }
    }),
  );
}
