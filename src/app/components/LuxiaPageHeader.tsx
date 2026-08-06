import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Check, CircleHelp, Clock, Pencil, X } from "lucide-react";
import { LUXIA_PAGE_LAYOUT } from "@/app/components/luxiaPageLayout";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export type LuxiaPageHeaderWidthVariant =
  | "overview"
  | "library"
  | "default"
  | "wide";

export const LUXIA_PAGE_HEADER_WIDTH: Record<
  LuxiaPageHeaderWidthVariant,
  string
> = {
  overview: LUXIA_PAGE_LAYOUT.maxWidth.standard,
  library: LUXIA_PAGE_LAYOUT.maxWidth.standard,
  default: LUXIA_PAGE_LAYOUT.maxWidth.standard,
  wide: LUXIA_PAGE_LAYOUT.maxWidth.wide,
};

export function getLuxiaPageHeaderMaxWidth(
  variant: LuxiaPageHeaderWidthVariant,
): string {
  return LUXIA_PAGE_HEADER_WIDTH[variant];
}

export const LUXIA_PAGE_INTRO = {
  padTop: LUXIA_PAGE_LAYOUT.padTop,
  padInline: LUXIA_PAGE_LAYOUT.gutter,
  eyebrowGapClass: "mb-1.5",
  titleToBreadcrumbGapClass: "mb-1.5",
  contextGapClass: "mt-3",
  guideGapClass: "mt-2",
  trailingGapClass: "mt-3",
  contentBelowClass: "mb-4",
  descriptionMax: "780px",
  /** Informational guide tone — soft blue, not alert. */
  guideColor: "var(--luxia-blue-70)",
  contextColor: "var(--luxia-text-secondary)",
} as const;

/** @deprecated Use LUXIA_PAGE_INTRO */
export const LUXIA_PAGE_HEADER_SHELL = {
  padTop: LUXIA_PAGE_INTRO.padTop,
  padInline: LUXIA_PAGE_INTRO.padInline,
} as const;

const TITLE_HIT =
  "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:pointer-events-none disabled:opacity-40";

export interface LuxiaPageHeaderProps {
  title: ReactNode;
  pageTypeLabel?: string;
  /** Custom eyebrow when pageTypeLabel is not used. */
  eyebrow?: ReactNode;
  breadcrumb?: ReactNode;
  /**
   * Compact factual metadata (type · status · project).
   * Preferred over legacy `metadata`.
   */
  context?: ReactNode;
  /** @deprecated Prefer `context`. */
  metadata?: ReactNode;
  /**
   * Optional one-line guide / explanation under context.
   * Preferred over legacy `description`. Auto-wraps with guide icon treatment.
   */
  guide?: ReactNode;
  /** @deprecated Prefer `guide`. */
  description?: ReactNode;
  onRename?: (name: string) => void;
  renameLabel?: string;
  /**
   * Quiet entity timestamp metadata on the title row (e.g. Updated 2h ago).
   * Renders after the title / rename control and before page actions.
   */
  titleMetadata?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  options?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
  titleClassName?: string;
  titleStyle?: CSSProperties;
  contentGap?: "chat" | "page" | "none";
  /**
   * Optional leading icon for the title row (capability pages).
   * Rendered only when provided — never an empty placeholder column.
   */
  titleLeading?: ReactNode;
  /**
   * When true, `titleLeading` is exposed to assistive technologies.
   * Use for interactive controls such as Exit. Decorative icons should omit this.
   */
  titleLeadingAccessible?: boolean;
  /** @deprecated No longer reserves an empty icon column. */
  reserveTitleLeading?: boolean;
}

export const LUXIA_PAGE_TITLE_LEADING_SLOT =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center";

/**
 * Shared page-header action conventions.
 * Prefer these over page-specific Button sizes/variants.
 *
 * Visual LTR order in the header cluster:
 * primary → secondary / cancel → miscellaneous `actions` (incl. tertiary help) → options menu
 */
export const LUXIA_PAGE_HEADER_ACTION = {
  size: "compact" as const,
  primary: { variant: "primary" as const, size: "compact" as const },
  secondary: { variant: "secondary" as const, size: "compact" as const },
  /** Low-emphasis / help — transparent, no permanent border. */
  tertiary: { variant: "tertiary" as const, size: "compact" as const },
  /** Explicit back when breadcrumb alone is insufficient. */
  back: { variant: "secondary" as const, size: "compact" as const },
  /** Bordered settings-style secondary (Chat/Galaxy Settings). */
  settings: { variant: "secondary" as const, size: "compact" as const },
  /** Overflow / three-dot — prefer LuxiaEntityOptionsMenu icon trigger. */
  menuTrigger: "icon" as const,
} as const;

const GAP: Record<
  NonNullable<LuxiaPageHeaderProps["contentGap"]>,
  string
> = {
  chat: "",
  page: LUXIA_PAGE_INTRO.contentBelowClass,
  none: "",
};

function entityWordFromPageType(
  pageTypeLabel: string | null,
): "Project" | "Galaxy" | "Chat" | "Entity" {
  const key = pageTypeLabel?.trim().toUpperCase();

  if (key === "PROJECT") return "Project";
  if (key === "GALAXY") return "Galaxy";
  if (key === "CHAT") return "Chat";

  return "Entity";
}

function PageTypeLabel({
  children,
}: {
  children: string;
}) {
  return (
    <p
      className="luxia-type-overline-data"
      style={{ color: "var(--luxia-purple-60)" }}
    >
      {children}
    </p>
  );
}

export function LuxiaPageContext({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 luxia-type-caption ${className}`.trim()}
      style={{ color: LUXIA_PAGE_INTRO.contextColor }}
    >
      {children}
    </div>
  );
}

/** Quiet entity timestamp for the page-header title row — not a notification. */
export function LuxiaPageEntityUpdatedMeta({
  updatedAt,
  prefix = "Updated",
  className = "",
}: {
  updatedAt: string;
  prefix?: string;
  className?: string;
}) {
  const label = `${prefix} ${updatedAt}`.trim();
  return (
    <p
      className={`inline-flex min-w-0 shrink-0 items-center gap-1 luxia-type-caption ${className}`.trim()}
      style={{ color: "var(--luxia-text-muted)" }}
      aria-label={label}
    >
      <Clock
        size={13}
        strokeWidth={1.75}
        aria-hidden="true"
        className="shrink-0"
      />
      <span className="truncate">{label}</span>
    </p>
  );
}

export function LuxiaPageGuide({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-start gap-1.5 ${className}`.trim()}
      style={{ color: LUXIA_PAGE_INTRO.guideColor }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="mt-0.5 inline-flex shrink-0"
            style={{ color: LUXIA_PAGE_INTRO.guideColor }}
          >
            <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          Guide
        </TooltipContent>
      </Tooltip>
      <div className="min-w-0 luxia-type-body-small" style={{ color: LUXIA_PAGE_INTRO.guideColor }}>
        {children}
      </div>
    </div>
  );
}

function wrapGuideContent(guide: ReactNode): ReactNode {
  if (guide == null || guide === false) return null;
  if (typeof guide === "string" || typeof guide === "number") {
    return <LuxiaPageGuide>{String(guide)}</LuxiaPageGuide>;
  }
  return <LuxiaPageGuide>{guide}</LuxiaPageGuide>;
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
  const idleColor =
    tone === "emphasis"
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
      onMouseEnter={(event) => {
        if (disabled) return;

        const element = event.currentTarget;
        element.style.background =
          "var(--luxia-opacity-brand-primary-08)";
        element.style.color =
          "var(--luxia-purple-70)";
      }}
      onMouseLeave={(event) => {
        const element = event.currentTarget;
        element.style.background = "transparent";
        element.style.color = idleColor;
      }}
    >
      {children}
    </button>
  );
}

export function LuxiaPageHeaderShell({
  children,
  trailing,
  className = "",
  style,
}: {
  children: ReactNode;
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
      <div
        className="w-full min-w-0"
        style={{
          paddingInline:
            LUXIA_PAGE_INTRO.padInline,
        }}
      >
        {children}
      </div>

      {trailing ? (
        <div
          className={`w-full min-w-0 ${LUXIA_PAGE_INTRO.trailingGapClass}`}
          style={{
            paddingInline:
              LUXIA_PAGE_INTRO.padInline,
          }}
        >
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

export function LuxiaPageHeader({
  title,
  pageTypeLabel,
  eyebrow,
  breadcrumb,
  description,
  metadata,
  context,
  guide,
  onRename,
  renameLabel,
  titleMetadata,
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
  titleLeading,
  titleLeadingAccessible = false,
  reserveTitleLeading: _reserveTitleLeading = false,
}: LuxiaPageHeaderProps) {
  const typeLabel =
    pageTypeLabel?.trim() || null;

  const entityWord =
    entityWordFromPageType(typeLabel);

  const labelNode = typeLabel ? (
    <PageTypeLabel>{typeLabel}</PageTypeLabel>
  ) : eyebrow ? (
    <div>{eyebrow}</div>
  ) : null;

  const contextNode = context ?? metadata ?? null;
  const guideNode = wrapGuideContent(guide ?? description ?? null);

  const stringTitle =
    typeof title === "string" ||
    typeof title === "number"
      ? String(title)
      : null;

  const canRename = Boolean(
    onRename && stringTitle,
  );

  const resolvedRenameLabel =
    renameLabel ??
    (stringTitle
      ? `Rename ${stringTitle}`
      : "Rename");

  const [isEditing, setIsEditing] =
    useState(false);
  const [draftName, setDraftName] =
    useState("");
  const [showEmptyError, setShowEmptyError] =
    useState(false);

  const inputRef =
    useRef<HTMLInputElement>(null);
  const pencilRef =
    useRef<HTMLButtonElement>(null);
  const editRootRef =
    useRef<HTMLDivElement>(null);
  const skipOutsideCancelRef =
    useRef(false);
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

    function onPointerDown(
      event: PointerEvent,
    ) {
      if (skipOutsideCancelRef.current) {
        skipOutsideCancelRef.current = false;
        return;
      }

      const root = editRootRef.current;

      if (!root) return;

      if (
        event.target instanceof Node &&
        root.contains(event.target)
      ) {
        return;
      }

      setIsEditing(false);
      setDraftName("");
      setShowEmptyError(false);

      window.setTimeout(
        () => pencilRef.current?.focus(),
        0,
      );
    }

    document.addEventListener(
      "pointerdown",
      onPointerDown,
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
      );
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

    window.setTimeout(
      () => pencilRef.current?.focus(),
      0,
    );
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

      window.setTimeout(
        () => pencilRef.current?.focus(),
        0,
      );

      return;
    }

    skipOutsideCancelRef.current = true;
    onRename?.(trimmedDraft);
    setIsEditing(false);
    setShowEmptyError(false);

    window.setTimeout(
      () => pencilRef.current?.focus(),
      0,
    );
  }

  const showTitleLeading = Boolean(titleLeading);

  const titleLeadingSlot = showTitleLeading ? (
    titleLeadingAccessible ? (
      <span className={LUXIA_PAGE_TITLE_LEADING_SLOT}>{titleLeading}</span>
    ) : (
      <span className={LUXIA_PAGE_TITLE_LEADING_SLOT} aria-hidden>
        {titleLeading}
      </span>
    )
  ) : null;

  const titleHeading = stringTitle ? (
    <h1
      className={`min-w-0 line-clamp-2 ${titleClassName}`}
      style={{
        overflowWrap: "anywhere",
        ...titleStyle,
      }}
      title={stringTitle}
    >
      {stringTitle}
    </h1>
  ) : (
    title
  );

  const titledHeadingRow = showTitleLeading ? (
    <div className="inline-flex max-w-full min-w-0 items-center gap-2.5">
      {titleLeadingSlot}
      <div className="min-w-0 flex-1">{titleHeading}</div>
    </div>
  ) : (
    titleHeading
  );

  const titleBlock =
    canRename && isEditing ? (
      <div
        ref={editRootRef}
        className="w-fit max-w-full min-w-0"
      >
        <h1 className="sr-only">
          {stringTitle}
        </h1>

        <div className="inline-flex w-fit max-w-full min-w-0 items-center gap-2">
          {titleLeadingSlot}
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            size={Math.min(
              48,
              Math.max(
                14,
                draftName.length + 2,
              ),
            )}
            onChange={(event) => {
              setDraftName(event.target.value);

              if (
                showEmptyError &&
                event.target.value.trim()
              ) {
                setShowEmptyError(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                saveEdit();
              } else if (
                event.key === "Escape"
              ) {
                event.preventDefault();
                event.stopPropagation();
                cancelEdit();
              }
            }}
            aria-label={`${entityWord} name`}
            aria-invalid={
              showEmptyError || undefined
            }
            aria-describedby={
              showEmptyError
                ? errorId
                : undefined
            }
            className={`min-w-0 shrink bg-transparent outline-none ${titleClassName}`}
            style={{
              width: `min(100%, max(13.75rem, min(32.5rem, ${
                Math.max(
                  draftName.length,
                  8,
                ) + 2
              }ch)))`,
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
              <Check
                size={16}
                strokeWidth={2}
                aria-hidden
              />
            </TitleUtilityButton>

            <TitleUtilityButton
              label={`Cancel ${entityWord} rename`}
              onClick={cancelEdit}
              tone="muted"
            >
              <X
                size={16}
                strokeWidth={2}
                aria-hidden
              />
            </TitleUtilityButton>
          </div>
        </div>

        {showEmptyError ? (
          <p
            id={errorId}
            className="luxia-type-caption mt-1"
            style={{
              color: "var(--luxia-error)",
            }}
            role="alert"
          >
            Name cannot be empty.
          </p>
        ) : null}
      </div>
    ) : canRename ? (
      <div
        className="inline-flex max-w-full min-w-0 items-center gap-[6px]"
      >
        {titledHeadingRow}

        <button
          ref={pencilRef}
          type="button"
          aria-label={resolvedRenameLabel}
          title="Rename"
          className={TITLE_HIT}
          style={{
            color:
              "var(--luxia-text-secondary)",
            background: "transparent",
          }}
          onClick={startEdit}
          onMouseEnter={(event) => {
            const element =
              event.currentTarget;

            element.style.background =
              "var(--luxia-opacity-brand-primary-08)";
            element.style.color =
              "var(--luxia-purple-70)";
          }}
          onMouseLeave={(event) => {
            const element =
              event.currentTarget;

            element.style.background =
              "transparent";
            element.style.color =
              "var(--luxia-text-secondary)";
          }}
        >
          <Pencil
            size={16}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </div>
    ) : stringTitle ? (
      titledHeadingRow
    ) : (
      titledHeadingRow
    );

  const titleRow = (
    <div
      className={`min-w-0 max-w-full${
        breadcrumb ? ` ${LUXIA_PAGE_INTRO.titleToBreadcrumbGapClass}` : ""
      }`}
    >
      {titleMetadata && !(canRename && isEditing) ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
          <div className="min-w-0">{titleBlock}</div>
          <div className="min-w-0 shrink-0 basis-full sm:basis-auto sm:ml-auto">
            {titleMetadata}
          </div>
        </div>
      ) : (
        titleBlock
      )}
    </div>
  );

  const actionNodes = [
    {
      key: "primary-action",
      node: primaryAction,
    },
    {
      key: "secondary-action",
      node: secondaryAction,
    },
    {
      key: "actions",
      node: actions,
    },
    {
      key: "options",
      node: options,
    },
  ].filter(
    (
      item,
    ): item is {
      key: string;
      node: ReactNode;
    } => Boolean(item.node),
  );

  return (
    <header
      className={`luxia-page-header w-full min-w-0 ${GAP[contentGap]} ${className}`.trim()}
      style={style}
    >
      <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          {labelNode ? (
            <div className={LUXIA_PAGE_INTRO.eyebrowGapClass}>
              {labelNode}
            </div>
          ) : null}

          {titleRow}

          {breadcrumb ? (
            <div className="min-w-0">
              {breadcrumb}
            </div>
          ) : null}
        </div>

        {actionNodes.length > 0 ? (
          <div className="ml-auto flex min-h-[40px] min-w-[11rem] shrink-0 flex-wrap items-center justify-end gap-2">
            {actionNodes.map(
              ({ key, node }) => (
                <Fragment key={key}>
                  {node}
                </Fragment>
              ),
            )}
          </div>
        ) : null}
      </div>

      {contextNode ? (
        <div className={`min-w-0 ${LUXIA_PAGE_INTRO.contextGapClass}`}>
          {contextNode}
        </div>
      ) : null}

      {guideNode ? (
        <div
          className={`min-w-0 ${LUXIA_PAGE_INTRO.guideGapClass}`}
          style={{
            maxWidth: LUXIA_PAGE_INTRO.descriptionMax,
          }}
        >
          {guideNode}
        </div>
      ) : null}

      {trailing ? (
        <div
          className={`min-w-0 ${LUXIA_PAGE_INTRO.trailingGapClass}`}
        >
          {trailing}
        </div>
      ) : null}

      {tabs ? (
        <div
          className={`min-w-0 ${LUXIA_PAGE_INTRO.trailingGapClass}`}
        >
          {tabs}
        </div>
      ) : null}
    </header>
  );
}