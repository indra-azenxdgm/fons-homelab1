export type NotificationEventType =
  | "booking.created"
  | "booking.confirmed"
  | "booking.canceled"
  | "booking.reminder";

export type NotificationChannel = "whatsapp" | "email";

export type NotificationTarget = {
  role: "customer" | "admin";
  channel: NotificationChannel;
  recipient: string;
};

export type NotificationEventPayload = {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  phone: string;
  email?: string | null;
  bookingDate: Date;
  timeSlot: string;
  serviceTypeName: string;
};

export type NotificationDispatchInput = {
  eventType: NotificationEventType;
  payload: NotificationEventPayload;
};

export type NotificationMessageContent = {
  title: string;
  body: string;
  variables: Record<string, string>;
};

export type NotificationMessage = {
  channel: NotificationChannel;
  templateKey: string;
  content: NotificationMessageContent;
};

export type NotificationProviderResult = {
  success: boolean;
  provider: string;
  externalId?: string;
  errorMessage?: string;
};

export interface NotificationProvider {
  name: string;
  supports(channel: NotificationChannel): boolean;
  send(input: {
    eventType: NotificationEventType;
    target: NotificationTarget;
    payload: NotificationEventPayload;
    message: NotificationMessage;
  }): Promise<NotificationProviderResult>;
}
