import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/app/components/ui/utils";

/**
 * Persistent contextual alert near related content.
 * Use for: skipped rows, connection result, partial import, dependency warnings.
 * Prefer toast for transient confirmations; prefer ConfirmDialog for decisions.
 */
export type LuxiaInlineAlertTone = "info" | "success" | "warning" | "error";

const TONE_STYLES: Record<
  LuxiaInlineAlertTone,
  { root: string; icon: string; title: string; body: string }
> = {
  info: {
    root: "border-[var(--luxia-blue-30)] bg-[var(--luxia-blue-10)]",
    icon: "text-[var(--luxia-blue-70)]",
    title: "text-[var(--luxia-blue-70)]",
    body: "text-[var(--luxia-text-secondary)]",
  },
  success: {
    root: "border-[var(--luxia-opacity-success-24)] bg-[var(--luxia-opacity-success-08)]",
    icon: "text-[var(--luxia-success-70)]",
    title: "text-[var(--luxia-success-70)]",
    body: "text-[var(--luxia-text-secondary)]",
  },
  warning: {
    root: "border-[var(--luxia-opacity-warning-32)] bg-[var(--luxia-opacity-warning-12)]",
    icon: "text-[var(--luxia-warning-90)]",
    title: "text-[var(--luxia-warning-90)]",
    body: "text-[var(--luxia-text-secondary)]",
  },
  error: {
    root: "border-[var(--luxia-opacity-error-24)] bg-[var(--luxia-opacity-error-08)]",
    icon: "text-[var(--luxia-error-70)]",
    title: "text-[var(--luxia-error-70)]",
    body: "text-[var(--luxia-text-secondary)]",
  },
};

const DEFAULT_ICONS: Record<LuxiaInlineAlertTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export function InlineAlert({
  tone,
  title,
  children,
  action,
  icon: IconProp,
  className,
  role,
}: {
  tone: LuxiaInlineAlertTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon | null;
  className?: string;
  /** Defaults: error/warning → alert; info/success → status */
  role?: "alert" | "status";
}) {
  const styles = TONE_STYLES[tone];
  const Icon = IconProp === null ? null : IconProp ?? DEFAULT_ICONS[tone];
  const resolvedRole = role ?? (tone === "error" || tone === "warning" ? "alert" : "status");

  return (
    <div
      role={resolvedRole}
      data-slot="luxia-inline-alert"
      data-tone={tone}
      className={cn(
        "flex w-full min-w-0 items-start gap-2.5 rounded-[var(--luxia-radius-12)] border px-3 py-2.5",
        styles.root,
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn("mt-0.5 size-4 shrink-0", styles.icon)}
          aria-hidden
          strokeWidth={2}
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        {title ? (
          <p className={cn("luxia-type-body-small font-semibold leading-snug", styles.title)}>
            {title}
          </p>
        ) : null}
        {children ? (
          <div className={cn("luxia-type-caption leading-snug", styles.body)}>
            {children}
          </div>
        ) : null}
        {action ? <div className="pt-0.5">{action}</div> : null}
      </div>
    </div>
  );
}
