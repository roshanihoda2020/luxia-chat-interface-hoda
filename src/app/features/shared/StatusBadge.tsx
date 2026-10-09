import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDashed,
  Info,
  LoaderCircle,
  MinusCircle,
  XCircle,
} from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/app/components/ui/badge";
import { cn } from "@/app/components/ui/utils";

/**
 * Semantic status tones for compact status chips.
 * Prefer StatusBadge over inventing per-page tinted labels.
 *
 * Domain badges (pipeline topology, file-type csv/pdf/database, count badges)
 * may keep their own mapping — map them to StatusBadge only when the meaning
 * is a generic lifecycle/status.
 */
export type LuxiaStatusTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const TONE_TO_BADGE: Record<
  LuxiaStatusTone,
  NonNullable<VariantProps<typeof badgeVariants>["variant"]>
> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  neutral: "outline",
};

const DEFAULT_ICONS: Record<LuxiaStatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  neutral: MinusCircle,
};

/** Common product labels → tone (optional helper for call sites). */
export function statusToneForLabel(label: string): LuxiaStatusTone {
  const key = label.trim().toLowerCase();
  if (
    ["connected", "ready", "completed", "success", "published", "active"].includes(key)
  ) {
    return "success";
  }
  if (
    ["needs attention", "partial", "warning", "paused", "skipped"].includes(key)
  ) {
    return "warning";
  }
  if (["failed", "error", "denied"].includes(key)) {
    return "error";
  }
  if (
    ["syncing", "processing", "running", "queued", "importing"].includes(key)
  ) {
    return "info";
  }
  if (["archived", "inactive", "disabled", "draft"].includes(key)) {
    return "neutral";
  }
  return "neutral";
}

export function StatusBadge({
  tone,
  label,
  icon: IconProp,
  spinning,
  className,
  ...props
}: {
  tone: LuxiaStatusTone;
  label: string;
  /** Override default semantic icon. Pass `null` to hide icon (not recommended). */
  icon?: LucideIcon | null;
  /** Use for syncing/processing — animated indicator. */
  spinning?: boolean;
  className?: string;
} & Omit<ComponentProps<"span">, "children">) {
  const Icon =
    IconProp === null
      ? null
      : IconProp ??
        (spinning
          ? LoaderCircle
          : tone === "neutral" && /archiv/i.test(label)
            ? Archive
            : tone === "neutral" && /inactive|draft/i.test(label)
              ? CircleDashed
              : DEFAULT_ICONS[tone]);

  return (
    <Badge
      variant={TONE_TO_BADGE[tone]}
      role="status"
      aria-label={label}
      className={cn(
        "min-h-6 gap-1 px-2 font-normal",
        tone === "neutral" &&
          "border-[var(--luxia-border-subtle)] bg-[var(--luxia-neutral-surface-subtle,var(--luxia-surface))] text-[var(--luxia-text-secondary)]",
        className,
      )}
      {...props}
    >
      {Icon ? (
        <Icon
          className={cn("size-3 shrink-0", spinning && "animate-spin")}
          aria-hidden
          strokeWidth={2}
        />
      ) : null}
      <span>{label}</span>
    </Badge>
  );
}
