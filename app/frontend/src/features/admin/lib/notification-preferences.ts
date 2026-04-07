"use client";

import type {
  AdminNotificationPreferences,
  AdminNotificationType,
} from "@/features/admin/lib/contracts";

export const NOTIFICATION_PREFERENCES_EVENT = "fons:notification-preferences";

export function dispatchNotificationPreferencesEvent(payload: {
  availableNotificationTypes: AdminNotificationType[];
  notificationPreferences: AdminNotificationPreferences;
}) {
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, {
    detail: payload,
  }));
}

let hasUserInteracted = false;

export function enableNotificationAudioOnInteraction() {
  if (hasUserInteracted) {
    return () => undefined;
  }

  function markInteracted() {
    hasUserInteracted = true;
    window.removeEventListener("pointerdown", markInteracted);
    window.removeEventListener("keydown", markInteracted);
  }

  window.addEventListener("pointerdown", markInteracted, { once: true });
  window.addEventListener("keydown", markInteracted, { once: true });

  return () => {
    window.removeEventListener("pointerdown", markInteracted);
    window.removeEventListener("keydown", markInteracted);
  };
}

export function playNotificationSound() {
  if (!hasUserInteracted) {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;

  if (!AudioContextCtor) {
    return;
  }

  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 240);
  } catch {
    // Ignore playback failures caused by browser policy or environment limits.
  }
}
