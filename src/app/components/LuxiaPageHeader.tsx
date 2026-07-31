import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Check, Pencil, X } from "lucide-react";
import { HS } from "@/app/features/home/homeSurfaces";

/** Intentional contained header max-width variants — not used for Chat/Galaxy workspace headers. */
export type LuxiaPageHeaderWidthVariant = "overview" | "library";

/** Shared max-width tokens for centered overview/library page bodies. */
export const LUXIA_PAGE_HEADER_WIDTH: Record<LuxiaPageHeaderWidthVariant, string> = {
  overview: HS.overviewContentMax,
  library: HS.libraryContentMax,
};

export function getLuxiaPageHeaderMaxWidth(variant: LuxiaPageHeaderWidthVariant): string {
  return LUXIA_PAGE_HEADER_WIDTH[variant];
}

/**
 * Shared page-intro rhythm for Project, Chat, and Galaxy headings.
 * Horizontal padding matches HomePageShell (`HS.pagePadInline`).
 */
export const LUXIA_PAGE_INTRO = {
  padTop: "2rem",
  padInline: HS.pagePadInline,
  trailingGapClass: "mt-3",
  contentBelowClass: "mb-4",
  descriptionMax: "780px",
} as const;

/** @deprecated Use LUXIA_PAGE_INTRO */
export const LUXIA_PAGE_HEADER_SHELL = {
  padTop: LUXIA_PAGE_INTRO.padTop,
  padInline: LUXIA_PAGE_INTRO.padInline,
} as const;

/** Compact title-row utility hit area (~30×30). */
const TITLE_HIT =
  "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:pointer-events-none disabled:opacity-40";

export interface LuxiaPageHeaderProps {
  /** Primary page title — rendered as the sole page `h1` when a string. */
  title: ReactNode;
  /**
   * Compact uppercase page-type label above a user-defined entity name
   * (e.g. PROJECT, GALAXY, CHAT). Prefer this over a freeform `eyebrow`
   * for named entity workspaces.
   */
  pageTypeLabel?: string;
  /** Optional freeform label above the title when `pageTypeLabel` is not used. */
  eyebrow?: ReactNode;
  /** Breadcrumb trail — typically `LuxiaBreadcrumb`. */
  breadcrumb?: ReactNode;
  /** Optional supporting description under the breadcrumb. */
  description?: ReactNode;
  /** Optional metadata chips / counts under description. */
  metadata?: ReactNode;
  /**
   * Enables inline title Rename when provided with a string `title`.
   * Receives trimmed non-empty name. Caller preserves stable entity ID.
   */
  onRename?: (name: string) => void;
  /** Accessible name for the rename pencil, e.g. `Rename Project name 01`. */
  renameLabel?: string;
  /**
   * Named-entity action hierarchy (preferred):
   * primary → important secondary → Options.
   * Composed with `actions` when both are provided.
   */
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Typically `LuxiaEntityOptionsMenu` for named-entity detail pages. */
  options?: ReactNode;
  /**
   * Page-level actions aligned top-right on desktop.
   * Prefer `primaryAction` / `secondaryAction` / `options` for named entities;
   * `actions` remains for freeform or legacy composition.
   */
  actions?: ReactNode;
  /** Optional tab strip / sub-navigation; omitted when unused (no empty space). */
  tabs?: ReactNode;
  /** Extra trailing content below the main header block. */
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Title typography class — defaults to Chat-matched page title. */
  titleClassName?: string;
  titleStyle?: CSSProperties;
  /**
   * Spacing under the header block before page content.
   * - `chat`: tight (Chat/Galaxy shell)
   * - `page`: compact page gap (Project / archives)
   * - `none`: caller owns outer gap
   */
  contentGap?: "chat" | "page" | "none";
}

const GAP: Record<NonNullable<LuxiaPageHeaderProps["contentGap"]>, string> = {
  chat: "",
  page: LUXIA_PAGE_INTRO.contentBelowClass,
  none: "",
};

function entityWordFromPageType(pageTypeLabel: string | null): "Project" | "Galaxy" | "Chat" | "Entity" {
  const key = pageTypeLabel?.trim().toUpperCase();
  if (key === "PROJECT") return "Project";
  if (key === "GALAXY") return "Galaxy";
  if (key === "CHAT") return "Chat";
  return "Entity";
}

function PageTypeLabel({ children }: { children: string }) {
  return (
    <p
      className="luxia-type-overline-data"
      style={{ color: "var(--luxia-purple-60)" }}
    >
      {children}
    </p>
  );
}

function TitleUtilityButton({
  label,
  onClick,
  disabled,
  tone = "muted",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "emphasis" | "muted";
  children: ReactNode;
}) {
  const idleColor = tone === "emphasis"
    ? "var(--luxia-purple-70)"
    : "var(--luxia-text-secondary)";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={TITLE_HIT}
      style={{
        color: idleColor,
        background: "transparent",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget;
        el.style.background = "var(--luxia-opacity-brand-primary-08)";
        el.style.color = "var(--luxia-purple-70)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.color = idleColor;
      }}
    >
      {children}
    </button>
  );
}

/**
 * Full-width operational page header shell for Chat/Galaxy.
 * Spans the complete main-content width after the Sidebar.
 * Inspector width does not constrain this region.
 */
export function LuxiaPageHeaderShell({
  children,
  trailing,
  className = "",
  style,
}: {
  children: ReactNode;
  /** Full-width tab strip below the title block. */
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`luxia-page-header-shell flex-shrink-0 w-full min-w-0 ${className}`.trim()}
      style={{
        paddingTop: LUXIA_PAGE_INTRO.padTop,
        ...style,
      }}
    >
      <div className="w-full min-w-0" style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }}>
        {children}
      </div>
      {trailing ? (
        <div
          className={`w-full min-w-0 ${LUXIA_PAGE_INTRO.trailingGapClass}`}
          style={{ paddingInline: LUXIA_PAGE_INTRO.padInline }}
        >
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Shared Luxia page heading region.
 * Canonical layout mirrors Project Overview:
 * optional page-type label, title (+ optional inline Rename) + actions on one row,
 * breadcrumb under the title.
 */
export function LuxiaPageHeader({
  title,
  pageTypeLabel,
  eyebrow,
  breadcrumb,
  description,
  metadata,
  onRename,
  renameLabel,
  primaryAction,
  secondaryAction,
  options,
  actions,
  tabs,
  trailing,
  className = "",
  style,
  titleClassName = "luxia-type-title-page",
  titleStyle,
  contentGap = "page",
}: LuxiaPageHeaderProps) {
  const typeLabel = pageTypeLabel?.trim() || null;
  const entityWord = entityWordFromPageType(typeLabel);
  const labelNode = typeLabel ? (
    <PageTypeLabel>{typeLabel}</PageTypeLabel>
  ) : eyebrow ? (
    <div>{eyebrow}</div>
  ) : null;

  const stringTitle = typeof title === "string" || typeof title === "number"
    ? String(title)
    : null;
  const canRename = Boolean(onRename && stringTitle);
  const resolvedRenameLabel = renameLabel
    ?? (stringTitle ? `Rename ${stringTitle}` : "Rename");

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showEmptyError, setShowEmptyError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pencilRef = useRef<HTMLButtonElement>(null);
  const editRootRef = useRef<HTMLDivElement>(null);
  const skipOutsideCancelRef = useRef(false);
  const errorId = useId();

  const trimmedDraft = draftName.trim();
  const canSave = trimmedDraft.length > 0;

  useEffect(() => {
    if (!isEditing) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;

    function onPointerDown(event: PointerEvent) {
      if (skipOutsideCancelRef.current) {
        skipOutsideCancelRef.current = false;
        return;
      }
      const root = editRootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setIsEditing(false);
      setDraftName("");
      setShowEmptyError(false);
      window.setTimeout(() => pencilRef.current?.focus(), 0);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isEditing]);

  function startEdit() {
    if (!stringTitle) return;
    setDraftName(stringTitle);
    setShowEmptyError(false);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraftName("");
    setShowEmptyError(false);
    window.setTimeout(() => pencilRef.current?.focus(), 0);
  }

  function saveEdit() {
    if (!canSave) {
      setShowEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    if (trimmedDraft === stringTitle) {
      setIsEditing(false);
      setShowEmptyError(false);
      window.setTimeout(() => pencilRef.current?.focus(), 0);
      return;
    }
    skipOutsideCancelRef.current = true;
    onRename?.(trimmedDraft);
    setIsEditing(false);
    setShowEmptyError(false);
    window.setTimeout(() => pencilRef.current?.focus(), 0);
  }

  const titleHeading = stringTitle ? (
    <h1
      className={`min-w-0 line-clamp-2 ${titleClassName}`}
      style={{ overflowWrap: "anywhere", ...titleStyle }}
      title={stringTitle}
    >
      {stringTitle}
    </h1>
  ) : (
    title
  );

  const titleBlock = canRename && isEditing ? (
    <div
      ref={editRootRef}
      className={`w-fit max-w-full min-w-0${breadcrumb ? " mb-1.5" : ""}`}
    >
      <h1 className="sr-only">{stringTitle}</h1>
      <div className="inline-flex w-fit max-w-full min-w-0 items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draftName}
          size={Math.min(48, Math.max(14, draftName.length + 2))}
          onChange={(e) => {
            setDraftName(e.target.value);
            if (showEmptyError && e.target.value.trim()) setShowEmptyError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              saveEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              cancelEdit();
            }
          }}
          aria-label={`${entityWord} name`}
          aria-invalid={showEmptyError || undefined}
          aria-describedby={showEmptyError ? errorId : undefined}
          className={`min-w-0 shrink bg-transparent outline-none ${titleClassName}`}
          style={{
            width: `min(100%, max(13.75rem, min(32.5rem, ${Math.max(draftName.length, 8) + 2}ch)))`,
            border: "none",
            borderBottom: showEmptyError
              ? "2px solid var(--luxia-error)"
              : "2px solid var(--luxia-border-focus)",
            borderRadius: 0,
            paddingInline: "2px",
            paddingBlock: "0",
            lineHeight: "40px",
            height: "40px",
            boxShadow: "none",
            color: "var(--luxia-purple-70)",
            ...titleStyle,
          }}
        />
        <div className="inline-flex shrink-0 items-center gap-1">
          <TitleUtilityButton
            label={`Save ${entityWord} name`}
            onClick={saveEdit}
            disabled={!canSave}
            tone="emphasis"
          >
            <Check size={16} strokeWidth={2} aria-hidden />
          </TitleUtilityButton>
          <TitleUtilityButton
            label={`Cancel ${entityWord} rename`}
            onClick={cancelEdit}
            tone="muted"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </TitleUtilityButton>
        </div>
      </div>
      {showEmptyError ? (
        <p
          id={errorId}
          className="luxia-type-caption mt-1"
          style={{ color: "var(--luxia-error)" }}
          role="alert"
        >
          Name cannot be empty.
        </p>
      ) : null}
    </div>
  ) : canRename ? (
    <div
      className={`inline-flex max-w-full min-w-0 items-center gap-[6px]${breadcrumb ? " mb-1.5" : ""}`}
    >
      {titleHeading}
      <button
        ref={pencilRef}
        type="button"
        aria-label={resolvedRenameLabel}
        title="Rename"
        className={TITLE_HIT}
        style={{
          color: "var(--luxia-text-secondary)",
          background: "transparent",
        }}
        onClick={startEdit}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "var(--luxia-opacity-brand-primary-08)";
          el.style.color = "var(--luxia-purple-70)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "transparent";
          el.style.color = "var(--luxia-text-secondary)";
        }}
      >
        <Pencil size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  ) : stringTitle ? (
    <div className={breadcrumb ? "mb-1.5" : undefined}>{titleHeading}</div>
  ) : (
    titleHeading
  );

  const actionNodes = [primaryAction, secondaryAction, options, actions].filter(Boolean);

  return (
    <header className={`luxia-page-header w-full min-w-0 ${GAP[contentGap]} ${className}`.trim()} style={style}>
      <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          {labelNode ? <div className="mb-1.5">{labelNode}</div> : null}
          {titleBlock}
          {breadcrumb ? <div className="min-w-0">{breadcrumb}</div> : null}
        </div>

        {actionNodes.length > 0 ? (
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actionNodes}
          </div>
        ) : null}
      </div>

      {description ? (
        <div
          className="mt-3 min-w-0"
          style={{ maxWidth: LUXIA_PAGE_INTRO.descriptionMax }}
        >
          {description}
        </div>
      ) : null}
      {metadata ? <div className="mt-3 min-w-0">{metadata}</div> : null}
      {trailing ? <div className={`min-w-0 ${LUXIA_PAGE_INTRO.trailingGapClass}`}>{trailing}</div> : null}
      {tabs ? <div className={`min-w-0 ${LUXIA_PAGE_INTRO.trailingGapClass}`}>{tabs}</div> : null}
    </header>
  );
}
