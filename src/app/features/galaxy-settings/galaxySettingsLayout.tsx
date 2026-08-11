import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  LUXIA_SETTINGS_LIST_SURFACE_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";

/** Form-focused tabs (General, Instructions) — ~720–820px */
export const GS_FORM_TAB_WIDTH = "w-full max-w-[52rem]";

/** List / information tabs — ~900–1100px */
export const GS_LIST_TAB_WIDTH = "w-full max-w-[68rem]";

/** Comfortable editable field width — ~560–680px */
export const GS_FORM_FIELD_WIDTH = "w-full max-w-[40rem]";

/** Access & availability list — ~700–850px */
export const GS_ACCESS_LIST_WIDTH = "w-full max-w-[52rem]";

export const GS_READONLY_INPUT_CLASS =
  "cursor-default border-[var(--luxia-settings-row-divider)] bg-[var(--luxia-surface-subtle)] text-[var(--luxia-text-secondary)] hover:border-[var(--luxia-settings-row-divider)] focus-visible:border-[var(--luxia-settings-row-divider)] focus-visible:shadow-none";

export const GS_SUBTLE_SURFACE = {
  background: "var(--luxia-surface-subtle)",
  border: "1px solid var(--luxia-settings-row-divider)",
  borderRadius: "var(--luxia-radius-12)",
} as const;

export function SectionOverline({ children }: { children: ReactNode }) {
  return (
    <p
      className="luxia-type-overline-data"
      style={{ color: "var(--luxia-text-secondary)" }}
    >
      {children}
    </p>
  );
}

export function SettingsDivider() {
  return (
    <div
      className="my-6 h-px w-full"
      style={{ background: "var(--luxia-settings-row-divider)" }}
      aria-hidden
    />
  );
}

export function SectionBlock({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <SectionOverline>{title}</SectionOverline>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DefinitionRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 gap-3 ${
        compact
          ? "flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between"
          : "flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-6"
      }`}
      style={compact ? undefined : { borderColor: "var(--luxia-settings-row-divider)" }}
    >
      <dt
        className={`luxia-type-caption shrink-0 ${compact ? "" : "sm:w-[11rem] lg:w-[13rem]"}`}
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {label}
      </dt>
      <dd
        className="luxia-type-body-dense min-w-0 flex-1"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

export function SummaryPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <aside
      className="rounded-[var(--luxia-radius-12)] p-4 lg:sticky lg:top-4"
      style={GS_SUBTLE_SURFACE}
    >
      <p
        className="luxia-type-overline-data mb-3"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {title}
      </p>
      <dl className="space-y-2">
        {rows.map((row) => (
          <DefinitionRow key={row.label} label={row.label} value={row.value} compact />
        ))}
      </dl>
    </aside>
  );
}

export function RouteModeOption({
  id,
  value,
  selected,
  title,
  description,
}: {
  id: string;
  value: string;
  selected: boolean;
  title: string;
  description: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[var(--luxia-radius-12)] border px-4 py-3.5 transition-colors"
      style={{
        borderColor: selected
          ? "var(--luxia-brand-primary)"
          : "var(--luxia-settings-row-divider)",
        background: selected
          ? "var(--luxia-opacity-brand-primary-04)"
          : "transparent",
      }}
    >
      <RadioGroupItem value={value} id={id} className="mt-1 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="luxia-type-body-dense-strong block">{title}</span>
        <span
          className="mt-1 block luxia-type-caption leading-relaxed"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          {description}
        </span>
      </span>
    </label>
  );
}

export function HeliosStatusHeading({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <h3
        className="luxia-type-body-default-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </h3>
      <span
        className="inline-flex items-center gap-1.5 luxia-type-caption"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: "var(--luxia-success)" }}
          aria-hidden
        />
        {status}
      </span>
    </div>
  );
}

export function HeliosFlowSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full luxia-type-caption tabular-nums"
            style={{
              color: "var(--luxia-text-secondary)",
              background: "var(--luxia-surface-subtle)",
              border: "1px solid var(--luxia-settings-row-divider)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            {step}
          </span>
          {index < steps.length - 1 ? (
            <ChevronRight
              size={14}
              aria-hidden
              className="hidden shrink-0 sm:inline"
              style={{ color: "var(--luxia-text-muted)" }}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function CapabilityRow({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: string;
}) {
  return (
    <li className="luxia-settings-row flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p
          className="luxia-type-body-default-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {name}
        </p>
        <p
          className="mt-1 luxia-type-body-dense"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          {description}
        </p>
      </div>
      <span
        className="luxia-type-caption shrink-0"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {status}
      </span>
    </li>
  );
}

export function SubsectionCollapsibleTrigger({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div
      className="flex w-full items-center justify-between gap-3 px-1 py-2 text-left"
      style={{ borderBottom: "1px solid var(--luxia-settings-row-divider)" }}
    >
      <span
        className="luxia-type-overline-data"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {title}
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="luxia-type-caption tabular-nums" style={{ color: "var(--luxia-text-muted)" }}>
          {count}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className="transition-transform group-data-[state=open]:rotate-180"
          style={{ color: "var(--luxia-text-muted)" }}
        />
      </span>
    </div>
  );
}

export function RelatedAccessNav({
  onOpenAccessLevels,
  onOpenDataSources,
}: {
  onOpenAccessLevels?: () => void;
  onOpenDataSources?: () => void;
}) {
  if (!onOpenAccessLevels && !onOpenDataSources) return null;

  const links: Array<{ label: string; onClick: () => void }> = [];
  if (onOpenAccessLevels) links.push({ label: "Access Levels", onClick: onOpenAccessLevels });
  if (onOpenDataSources) links.push({ label: "Data Sources", onClick: onOpenDataSources });

  return (
    <div className="pt-2">
      <p
        className="luxia-type-caption mb-2"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        Manage related access
      </p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <Button
              type="button"
              variant="link"
              size="compact"
              className="h-auto justify-start gap-1.5 p-0 luxia-type-body-dense"
              onClick={link.onClick}
            >
              {link.label}
              <ChevronRight size={14} aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConflictSurface({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[var(--luxia-radius-12)] p-3"
      style={{
        background: "var(--luxia-surface-subtle)",
        border: "1px solid var(--luxia-settings-row-divider)",
      }}
    >
      {children}
    </div>
  );
}

export function SettingsListSurface({
  children,
  className = "",
  scrollable = false,
}: {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <ul
      className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4 ${scrollable ? "max-h-[min(24rem,50vh)] overflow-y-auto" : ""} ${className}`.trim()}
      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
    >
      {children}
    </ul>
  );
}
