import { useEffect, useRef } from "react";
import { getTurnstileSiteKey } from "@/app/features/login/prototypeAuth";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme: "dark" | "light";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(script);
  });
}

/**
 * Real Cloudflare Turnstile only. Renders nothing when no site key is configured.
 * Does not fake a CAPTCHA.
 */
export function TurnstileField({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const siteKey = getTurnstileSiteKey();
  const hostRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current(null);
      return;
    }
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) onTokenRef.current(null);
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div className="luxia-login-turnstile">
      <div ref={hostRef} className="luxia-login-turnstile-host" />
    </div>
  );
}

export function isTurnstileRequired(): boolean {
  return Boolean(getTurnstileSiteKey());
}
