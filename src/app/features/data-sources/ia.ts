/**
 * Data Sources library IA — organization/user-level accessible catalog.
 */

export const DATA_SOURCES_PAGE_VARIANT = "standard" as const;

export const DATA_SOURCES_GUIDANCE = {
  pageTypeLabel: "DATA",
  title: "Data Sources",
  description:
    "Manage the Data Sources available to you and see where they are used.",
  emptyTitle: "No Data Sources yet",
  emptyBody: "No Data Sources are currently available to you.",
  filteredEmptyTitle: "No matching Data Sources",
} as const;
