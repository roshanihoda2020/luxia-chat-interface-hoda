/** Comfortable width for summary cards on narrower pipeline forms (legacy). */
export const PIPELINE_SUMMARY_MAX_WIDTH_CLASS = "max-w-4xl";

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
