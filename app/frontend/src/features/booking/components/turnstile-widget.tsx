"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

import { publicEnv } from "@/lib/env";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string) => void;
};

export function TurnstileWidget({ onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!publicEnv.turnstileEnabled || !publicEnv.turnstileSiteKey) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: publicEnv.turnstileSiteKey,
        callback: (token) => onTokenChange(token),
        "expired-callback": () => onTokenChange(""),
        "error-callback": () => onTokenChange(""),
      });

      window.clearInterval(interval);
    }, 250);

    return () => {
      window.clearInterval(interval);

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange]);

  if (!publicEnv.turnstileEnabled || !publicEnv.turnstileSiteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div className="space-y-2">
        <div ref={containerRef} />
        <p className="text-xs text-muted-foreground">
          Verifikasi diaktifkan untuk membantu mengurangi spam.
        </p>
      </div>
    </>
  );
}
