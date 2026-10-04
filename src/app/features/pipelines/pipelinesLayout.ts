export const PIPELINE_SUMMARY_MAX_WIDTH_CLASS = "max-w-4xl";

export const PIPELINE_SECTION_TITLE_CLASS = "luxia-type-title-section";

export const PIPELINE_SECTION_HEADER_GAP_CLASS = "mb-2.5";

export const PIPELINE_SECTION_HELPER_CLASS = "mt-0.5 luxia-type-caption";

/**
 * Shared left-aligned content width for Pipelines list + detail.
 * Caps stretch on 1920px+ while staying fluid on laptops (≈1440px).
 */
export const PIPELINES_CONTENT_MAX_WIDTH_CLASS = "max-w-[90rem]";

export const PIPELINES_LIST_CONTENT_MAX_WIDTH_CLASS =
  PIPELINES_CONTENT_MAX_WIDTH_CLASS;

export const PIPELINE_RUNS_GROUP_CLASS = "space-y-6";

/** Default number of runs shown on Pipeline Detail before “View all runs”. */
export const PIPELINE_RECENT_RUNS_PREVIEW_COUNT = 5;

/**
 * Shared Tasks / structured-list panel surfaces.
 * Selected-state colors for tasks come from `taskFlowSelectedVisual(status)` —
 * semantic, never black / brand-purple rings.
 */
export const PIPELINE_TASK_SELECTED = {
  rowIdle:
    "color-mix(in srgb, var(--luxia-neutral-50) 55%, var(--luxia-surface))",
  rowHover:
    "color-mix(in srgb, var(--luxia-neutral-100) 70%, var(--luxia-surface))",
  rowElevation: "0 1px 3px rgba(15, 23, 42, 0.06)",
  panelElevation: "var(--luxia-shadow-xs)",
} as const;

/**
 * Soft “Latest / newest run” surface — quiet neutral/lilac wash.
 * Always paired with a text “Latest” label for accessibility.
 */
export const PIPELINE_LATEST_SURFACE =
  "color-mix(in srgb, var(--luxia-opacity-brand-secondary-08) 42%, color-mix(in srgb, var(--luxia-neutral-50) 55%, var(--luxia-surface)))";

export const PIPELINE_TABLE_HEADER_SURFACE =
  "color-mix(in srgb, var(--luxia-neutral-50) 72%, var(--luxia-surface))";

export const PIPELINE_MATRIX_ROW_DIVIDER =
  "1px solid color-mix(in srgb, var(--luxia-border-default) 48%, transparent)";

export const PIPELINE_MATRIX_TASK_EDGE =
  "1px 0 0 0 color-mix(in srgb, var(--luxia-border-subtle) 70%, transparent)";

/**
 * Shared structured-list chrome for Pipelines list + Recent runs.
 * Same family; Recent runs may add chevron / Latest as richer affordances.
 */
export const PIPELINE_STRUCTURED_LIST = {
  headerBorder: "1px solid var(--luxia-border-default)",
  headerClass:
    "hidden gap-x-3 px-4 py-2.5 sm:grid sm:items-center",
  headerLabelClass: "luxia-type-table-header-dense",
  bodyClass: "m-0 flex list-none flex-col gap-2 p-2.5 sm:p-3",
  rowClass:
    "rounded-[10px] border px-3.5 py-3 outline-none transition-[background-color,border-color,box-shadow] sm:px-4",
  rowBorderIdle: "var(--luxia-border-default)",
  rowBorderHover: "var(--luxia-border-strong)",
} as const;
