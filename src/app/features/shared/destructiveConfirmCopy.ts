/**
 * Canonical destructive confirm copy for Constellation Settings + Chat capsule.
 * Keep Chat and Settings managers aligned — do not fork wording per surface.
 */

export type DestructiveConfirmCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  successToast: string;
  errorToast: string;
};

export const DESTRUCTIVE_CONFIRM = {
  table: {
    title: "Remove this table from the Constellation?",
    description:
      "This table will no longer be available to this Constellation. The underlying Data Source will not be deleted.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "Table removed",
    errorToast: "Could not remove the table",
  },
  view: {
    title: "Remove this View from the Constellation?",
    description:
      "This View will no longer be available to this Constellation. The underlying database View will not be deleted.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "View removed",
    errorToast: "Could not remove the View",
  },
  pdf: {
    title: "Remove this PDF file?",
    description:
      "This file will be removed from the current Constellation. The original file will not be deleted.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "PDF file removed",
    errorToast: "Could not remove the PDF file",
  },
  extraContext: {
    title: "Remove this Extra Context file?",
    description:
      "This file will no longer be used as Extra Context by this Constellation. The original source file will not be deleted.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "Extra Context file removed",
    errorToast: "Could not remove the Extra Context file",
  },
  crawler: {
    title: "Remove this Crawler URL?",
    description: "This URL will be removed from this Constellation.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "Crawler URL removed",
    errorToast: "Could not remove the Crawler URL",
  },
  relationship: {
    title: "Remove this relationship?",
    description: "This relationship will be removed from this Constellation.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "Relationship removed",
    errorToast: "Could not remove the relationship",
  },
  metric: {
    title: "Remove this metric?",
    description: "This metric will be removed from this Constellation.",
    confirmLabel: "Remove",
    busyLabel: "Removing…",
    successToast: "Metric removed",
    errorToast: "Could not remove the metric",
  },
  knowledgeEntry: {
    title: "Delete this Knowledge Entry?",
    description: "This Knowledge Entry will be deleted from the Knowledge Base.",
    confirmLabel: "Delete",
    busyLabel: "Deleting…",
    successToast: "Knowledge Entry deleted",
    errorToast: "Could not delete the Knowledge Entry",
  },
  dataSource: {
    title: "Disconnect this Data Source?",
    description:
      "This Data Source will be disconnected from this Constellation. The Data Source itself will not be deleted.",
    confirmLabel: "Remove",
    busyLabel: "Disconnecting…",
    successToast: "Data Source disconnected",
    errorToast: "Could not disconnect the Data Source",
  },
  constellationArchive: {
    title: "Archive this Constellation?",
    description:
      "This Constellation will be hidden from Chat and Galaxy until restored.",
    confirmLabel: "Archive",
    busyLabel: "Archiving…",
    successToast: "Constellation archived",
    errorToast: "Could not archive the Constellation",
  },
  constellationDelete: {
    title: "Delete this Constellation?",
    description:
      "This permanently removes the Constellation and its configuration. Connected Data Sources will not be deleted.",
    confirmLabel: "Delete",
    busyLabel: "Deleting…",
    successToast: "Constellation deleted",
    errorToast: "Could not delete the Constellation",
  },
} as const satisfies Record<string, DestructiveConfirmCopy>;

export const DESTRUCTIVE_REMOVE_DELAY_MS = 500;
