import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { LuxiaArrowRightIcon } from "@/assets/icons";

const SURFACE_CLASS =
  "rounded-[var(--luxia-radius-12)] border border-[var(--luxia-settings-section-border,var(--luxia-border-default))] bg-[var(--luxia-settings-section-bg,var(--luxia-neutral-50))]";

export function SettingsDialogSectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-4 min-w-0">
      <h2
        className="luxia-type-title-card mb-1"
        style={{ color: "var(--luxia-purple-70)" }}
      >
        {title}
      </h2>
      <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        {description}
      </p>
    </header>
  );
}

export function SettingsDialogSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${SURFACE_CLASS} min-w-0 ${className}`}>{children}</div>;
}

export function CompactInfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-6 py-3">
      <dt
        className="shrink-0 luxia-type-body-dense"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {label}
      </dt>
      <dd
        className="min-w-0 text-right luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

export function CompactMetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <div className={`${SURFACE_CLASS} flex min-w-0 flex-col gap-2 px-3.5 py-3.5`}>
      {icon ? (
        <span className="inline-flex shrink-0 text-[var(--luxia-text-muted)]" aria-hidden>
          {icon}
        </span>
      ) : null}
      <p
        className="min-w-0 truncate luxia-type-body-dense"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {label}
      </p>
      <p
        className="luxia-type-title-card tabular-nums leading-none"
        style={{ color: "var(--luxia-purple-70)" }}
      >
        {value}
      </p>
    </div>
  );
}

export function CompactManagerCard({
  title,
  metric,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  metric?: string | number;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className={`${SURFACE_CLASS} flex h-full min-w-0 flex-col px-4 py-3.5`}>
      <div className="mb-4 flex min-w-0 items-start gap-3">
        {icon ? (
          <span
            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)] text-[var(--luxia-text-muted)]"
            style={{ background: "var(--luxia-surface)" }}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p
            className="luxia-type-label-small mb-1"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {title}
          </p>
          {metric !== undefined ? (
            <p
              className="luxia-type-title-card tabular-nums leading-none"
              style={{ color: "var(--luxia-purple-70)" }}
            >
              {metric}
            </p>
          ) : null}
        </div>
      </div>
      <p
        className="mb-4 min-w-0 flex-1 luxia-type-body-dense"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {description}
      </p>
      <Button
        type="button"
        variant="outline"
        size="compact"
        className="self-start"
        onClick={onAction}
      >
        {actionLabel}
        <LuxiaArrowRightIcon size={14} aria-hidden />
      </Button>
    </div>
  );
}
