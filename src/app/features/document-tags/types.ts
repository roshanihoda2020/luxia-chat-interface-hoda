export type DocumentTagColorId =
  | "blue"
  | "teal"
  | "green"
  | "amber"
  | "orange"
  | "rose"
  | "purple"
  | "neutral";

/** Reusable Tag entity. Color lives here, not on each assignment. */
export interface DocumentTagDefinition {
  id: string;
  name: string;
  color: DocumentTagColorId;
}

/**
 * Creation-session draft only. Definitions here are tags created in this
 * session that are not yet in the Organization library.
 */
export interface DataSourceTagBucket {
  definitions: Record<string, DocumentTagDefinition>;
  sourceTagIds: string[];
  fileAssignments: Record<string, string[]>;
  tableAssignments: Record<string, string[]>;
}

/** Organization-level Tag library plus assignment indexes. */
export interface OrganizationTagLibrary {
  organizationId: string;
  definitions: Record<string, DocumentTagDefinition>;
  dataSourceAssignments: Record<string, string[]>;
  fileAssignments: Record<string, Record<string, string[]>>;
  tableAssignments: Record<string, Record<string, string[]>>;
  /**
   * Bootstrap-only. Once true, demo catalog assignments are never re-seeded.
   * Not a Tag definition or assignment.
   */
  demoAssignmentsSeeded?: boolean;
}

/** Prototype store: one library per Organization. */
export interface OrganizationTagStore {
  organizations: Record<string, OrganizationTagLibrary>;
}

/** @deprecated Use OrganizationTagLibrary. Kept as an alias for existing imports. */
export type DataSourceTagStore = OrganizationTagLibrary;

/** Derived effective Tag plus assignment provenance. Not a stored entity. */
export interface DataSourceEffectiveTag {
  tag: DocumentTagDefinition;
  direct: boolean;
  fromContent: boolean;
}
