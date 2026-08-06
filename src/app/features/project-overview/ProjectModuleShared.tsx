import type { CSSProperties, ReactNode } from "react";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import { HS } from "@/app/features/home/homeSurfaces";

export type ProjectModuleSurface =
  | "default"
  | "knowledge"
  | "interaction"
  | "output"
  | "assistant";

const MODULE_SURFACE: Record<
  ProjectModuleSurface,
  { background: string; borderColor: string; footerBorder: string; boxShadow: string }
> = {
  default: {
    background: "var(--luxia-surface)",
    borderColor: "var(--luxia-border-default)",
    footerBorder: "var(--luxia-border-subtle)",
    boxShadow: "var(--luxia-shadow-sm)",
  },
  knowledge: {
    background:
      "linear-gradient(0deg, var(--luxia-opacity-purple-12), var(--luxia-opacity-purple-12)), var(--luxia-surface)",
    borderColor:
      "color-mix(in srgb, var(--luxia-purple-20) 42%, var(--luxia-neutral-200))",
    footerBorder:
      "color-mix(in srgb, var(--luxia-purple-20) 32%, var(--luxia-neutral-200))",
    boxShadow: "var(--luxia-shadow-sm)",
  },
  interaction: {
    background:
      "linear-gradient(0deg, var(--luxia-opacity-purple-04), var(--luxia-opacity-purple-04)), var(--luxia-neutral-surface-subtle)",
    borderColor:
      "color-mix(in srgb, var(--luxia-purple-20) 28%, var(--luxia-neutral-200))",
    footerBorder: "var(--luxia-border-subtle)",
    boxShadow: "var(--luxia-shadow-sm)",
  },
  output: {
    background: "var(--luxia-blue-10)",
    borderColor:
      "color-mix(in srgb, var(--luxia-blue-20) 55%, var(--luxia-neutral-200))",
    footerBorder:
      "color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))",
    boxShadow: "var(--luxia-shadow-sm)",
  },
  assistant: {
    background:
      "linear-gradient(0deg, var(--luxia-opacity-purple-04), var(--luxia-opacity-purple-04)), var(--luxia-blue-10)",
    borderColor:
      "color-mix(in srgb, var(--luxia-purple-20) 22%, color-mix(in srgb, var(--luxia-blue-20) 35%, var(--luxia-neutral-200)))",
    footerBorder: "var(--luxia-border-subtle)",
    boxShadow: "none",
  },
};

export function ProjectCountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-[8px] px-1.5 luxia-type-caption tabular-nums"
      style={{
        color: "var(--luxia-text-secondary)",
        background: "var(--luxia-surface)",
        border: "1px solid var(--luxia-border-default)",
      }}
      aria-label={`${count} ${label}`}
    >
      {count}
    </span>
  );
}

export function ProjectModuleEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 py-4">
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
        {title}
      </p>
      <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)", maxWidth: 320 }}>
        {description}
      </p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function ProjectViewAllLink({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span>{label}</span>
      <LuxiaArrowRightIcon size={14} aria-hidden color="currentColor" />
    </>
  );

  if (!onClick) {
    return (
      <span
        className="inline-flex min-h-8 items-center gap-1 luxia-type-body-dense-strong"
        style={{ color: HS.viewAllText }}
      >
        {content}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      onClick={onClick}
      className="min-h-8 gap-1 luxia-type-body-dense-strong"
      style={{ color: HS.viewAllText }}
    >
      {content}
    </Button>
  );
}

export function ProjectOutlineButton({
  label,
  onClick,
  ariaLabel,
}: {
  label: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  if (!onClick) {
    return (
      <span
        className="luxia-button luxia-button--secondary luxia-button--compact pointer-events-none select-none"
        aria-hidden={false}
      >
        {label}
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="compact"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
    >
      {label}
    </Button>
  );
}

export function ProjectModuleCard({
  icon,
  title,
  count,
  countLabel,
  description,
  children,
  footer,
  marker,
  headingColor = "var(--luxia-purple-70)",
  iconColor = "var(--luxia-purple-60)",
  size = "knowledge",
  surface = "default",
}: {
  icon: ReactNode;
  title: string;
  count: number;
  countLabel: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  marker?: ReactNode;
  headingColor?: string;
  iconColor?: string;
  size?: "primary" | "knowledge" | "output" | "supporting";
  surface?: ProjectModuleSurface;
}) {
  const sizeClass =
    size === "primary"
      ? "min-h-[280px] p-5"
      : size === "supporting"
        ? "min-h-[220px] p-4"
        : size === "output"
          ? "min-h-0 p-4"
          : "min-h-[250px] p-4";

  const surfaceStyle = MODULE_SURFACE[surface];
  const sectionStyle: CSSProperties = {
    background: surfaceStyle.background,
    borderColor: surfaceStyle.borderColor,
    boxShadow: size === "supporting" ? "none" : surfaceStyle.boxShadow,
  };

  return (
    <section
      className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-16)] border ${sizeClass}`}
      style={sectionStyle}
    >
      {marker}
      <header className={`mb-2 flex min-w-0 shrink-0 items-center gap-2.5 ${marker ? "pr-11" : ""}`}>
        <span className="inline-flex shrink-0" style={{ color: iconColor }} aria-hidden>
          {icon}
        </span>
        <h2 className="luxia-type-title-card min-w-0 truncate" style={{ color: headingColor }}>
          {title}
        </h2>
        <ProjectCountBadge count={count} label={countLabel} />
      </header>
      {description ? (
        <p
          className={`mb-3 shrink-0 line-clamp-2 luxia-type-caption ${marker ? "pr-11" : ""}`}
          style={{ color: "var(--luxia-neutral-600, #475569)" }}
        >
          {description}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <footer
        className="mt-4 flex shrink-0 flex-nowrap items-center justify-between gap-3 pt-3"
        style={{ borderTop: `1px solid ${surfaceStyle.footerBorder}` }}
      >
        {footer}
      </footer>
    </section>
  );
}

export function ProjectPreviewRow({
  icon,
  title,
  meta,
  onClick,
  ariaLabel,
  iconColor = "var(--luxia-purple-60)",
  actions,
  showChevron = true,
}: {
  icon: ReactNode;
  title: string;
  meta?: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  iconColor?: string;
  /** Secondary controls (e.g. Settings). Rendered outside the primary Open control. */
  actions?: ReactNode;
  /** Hide trailing chevron when it duplicates another visible action. */
  showChevron?: boolean;
}) {
  const interactive = Boolean(onClick);
  const rowClass =
    "group flex w-full min-w-0 items-center gap-3 rounded-[10px] px-2 py-2.5 text-left outline-none transition-colors";

  const identity = (
    <>
      <span className="inline-flex shrink-0" style={{ color: iconColor }} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {title}
        </span>
        {meta ? (
          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            {meta}
          </span>
        ) : null}
      </span>
    </>
  );

  const chevron = showChevron ? (
    <LuxiaArrowRightIcon
      size={14}
      aria-hidden
      color="var(--luxia-text-muted)"
      className="opacity-70 transition-opacity group-hover:opacity-100"
    />
  ) : null;

  if (!interactive && !actions) {
    return <div className={rowClass}>{identity}</div>;
  }

  if (actions) {
    return (
      <div
        className={`${rowClass} hover:bg-[var(--luxia-opacity-brand-primary-04)]`}
      >
        {interactive ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="-mx-1 flex min-w-0 flex-1 items-center gap-3 rounded-[8px] px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          >
            {identity}
            {chevron}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
        )}
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${rowClass} hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]`}
    >
      {identity}
      {chevron}
    </button>
  );
}

export function ProjectMetaText({ children }: { children: ReactNode }) {
  return (
    <span className="luxia-type-caption" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
      {children}
    </span>
  );
}

export function ProjectSkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[10px] ${className}`}
      style={{ background: "var(--luxia-neutral-100, #F1F5F9)" }}
      aria-hidden
    />
  );
}
