/**
 * Data Sources library IA — organization/user-level accessible catalog.
 */

export const DATA_SOURCES_PAGE_VARIANT = "standard" as const;

export const DATA_SOURCES_GUIDANCE = {
  pageTypeLabel: "DATA",
  title: "Data Sources",
  description:
    "Manage the Data Sources available to you and see where they are used. Private sources stay with their owner unless shared through Access Levels — Organization Admins do not automatically Manage another user's private source.",
  emptyTitle: "No Data Sources yet",
  emptyBody: "No Data Sources are currently available to you.",
  filteredEmptyTitle: "No matching Data Sources",
} as const;
