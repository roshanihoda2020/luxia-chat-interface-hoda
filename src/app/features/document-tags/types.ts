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

/**
 * One-time move of a Data Source's filename-keyed File Tags to document IDs.
 * `ambiguousFileNames`: legacy names shared by several documents — their tags
 * were copied to every document with that name. `unmatchedFileNames`: legacy
 * names with no document record — left in fileAssignments untouched.
 */
export interface DocumentTagMigrationRecord {
  version: number;
  migratedAt: string;
  ambiguousFileNames: string[];
  unmatchedFileNames: string[];
}

/** Organization-level Tag library plus assignment indexes. */
export interface OrganizationTagLibrary {
  organizationId: string;
  definitions: Record<string, DocumentTagDefinition>;
  dataSourceAssignments: Record<string, string[]>;
  /**
   * Legacy File Tags keyed by filename: fileAssignments[dataSourceId][fileName].
   * Read only for Data Sources without a migration record. Never deleted by migration.
   */
  fileAssignments: Record<string, Record<string, string[]>>;
  tableAssignments: Record<string, Record<string, string[]>>;
  /**
   * File Tags keyed by document: documentAssignments[dataSourceId][localDocumentId].
   * Authoritative for every Data Source listed in documentTagMigrations.
   */
  documentAssignments: Record<string, Record<string, string[]>>;
  /**
   * Display filename per assigned document, for consumers that only know a
   * filename (Constellation file lists). Never used as identity.
   */
  documentFileNames: Record<string, Record<string, string>>;
  /** Data Sources whose File Tags moved to documentAssignments. */
  documentTagMigrations: Record<string, DocumentTagMigrationRecord>;
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
