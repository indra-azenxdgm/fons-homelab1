"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type ToastPayload = {
  id?: string;
  title: string;
  description?: string;
  href?: string;
};

const APP_TOAST_KEY = "fons-app-toast";
const APP_TOAST_EVENT = "fons:app-toast";

export function pushAppToast(toast: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(APP_TOAST_KEY, JSON.stringify(toast));
  window.dispatchEvent(new CustomEvent<ToastPayload>(APP_TOAST_EVENT, {
    detail: toast,
  }));
}

export function AppToastViewport() {
  const pathname = usePathname();
  const router = useRouter();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  function showToast(nextToast: ToastPayload) {
    setToast(nextToast);
    setIsVisible(true);
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextToast = window.sessionStorage.getItem(APP_TOAST_KEY);

    if (!nextToast) {
      return;
    }

    window.sessionStorage.removeItem(APP_TOAST_KEY);

    try {
      showToast(JSON.parse(nextToast) as ToastPayload);
    } catch {
      setToast(null);
      setIsVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    function handleToastEvent(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>;

      if (!customEvent.detail) {
        return;
      }

      showToast(customEvent.detail);
    }

    window.addEventListener(APP_TOAST_EVENT, handleToastEvent as EventListener);

    return () => {
      window.removeEventListener(APP_TOAST_EVENT, handleToastEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const hideTimer = window.setTimeout(() => setIsVisible(false), 2600);
    const clearTimer = window.setTimeout(() => setToast(null), 3000);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [isVisible]);

  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex justify-end">
      <button
        type="button"
        className={`app-toast pointer-events-auto flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-[1.25rem] border border-[#B9D6F0] bg-white/96 px-4 py-3 shadow-[0_18px_34px_-24px_rgba(0,81,162,0.28)] backdrop-blur-sm transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        } ${toast.href ? "cursor-pointer text-left" : "cursor-default text-left"}`}
        role="status"
        aria-live="polite"
        onClick={() => {
          if (!toast.href) {
            return;
          }

          setIsVisible(false);
          router.push(toast.href);
        }}
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E5F5EC] text-[#24714A]">
          <CheckCircle2 className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
              {toast.description}
            </p>
          ) : null}
        </div>
      </button>
    </div>
  );
}
