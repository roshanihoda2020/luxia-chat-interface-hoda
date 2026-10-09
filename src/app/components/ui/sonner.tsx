"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * Optional Sonner host with Luxia tokens.
 * App currently mounts `Toaster` from `sonner` directly — prefer `luxiaToast`
 * helpers for call-site copy; either host is fine as long as only one stack mounts.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--luxia-surface)",
          "--normal-text": "var(--luxia-text-primary)",
          "--normal-border": "var(--luxia-border-default)",
          "--success-bg": "var(--luxia-opacity-success-08)",
          "--success-border": "var(--luxia-opacity-success-24)",
          "--success-text": "var(--luxia-success-70)",
          "--error-bg": "var(--luxia-opacity-error-08)",
          "--error-border": "var(--luxia-opacity-error-24)",
          "--error-text": "var(--luxia-error-70)",
          "--warning-bg": "var(--luxia-opacity-warning-12)",
          "--warning-border": "var(--luxia-opacity-warning-32)",
          "--warning-text": "var(--luxia-warning-90)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
