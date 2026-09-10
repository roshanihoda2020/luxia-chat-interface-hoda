import type {
  CsvImportedColumnValueContext,
  DataSourceCatalogItem,
  DataSourceConnector,
} from "@/app/features/permissions/types";

export type DataSourceOwnershipChoice = "organizational" | "private";

export type DataSourceCreationReturnContext =
  | { kind: "library" }
  | {
      kind: "constellation-create" | "constellation-settings";
      projectId?: string;
      constellationId?: string;
    };

export type CreationPhase =
  | "chooser"
  | "database"
  | "csv"
  | "file";

export interface DatabaseConnectionFields {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  /** Snowflake */
  authMethod: "password" | "key-pair";
  account: string;
  role: string;
  warehouse: string;
  /** Snowflake key-pair (prototype; never persisted). */
  privateKey: string;
  passphrase: string;
  /** BigQuery */
  projectId: string;
  dataset: string;
}

export interface SchemaDiscoverySummary {
  schemaCount: number;
  tableCount: number;
}

export interface CsvColumnDraft {
  id: string;
  name: string;
  /** Original CSV header. Working `name` may be renamed later. */
  originalName?: string;
  normalizedName?: string;
  detectedType: string;
  type: string;
  examples: string[];
  dateFormat?: string;
  status?: "inferred" | "needs-review" | "modified" | "confirmed";
  warning?: string;
  role?: string;
  suggestedUsage?: string;
  notes?: string;
}

export interface CsvValidationIssue {
  rowNumber: number;
  rowIndex: number;
  columnId: string;
  columnName: string;
  value: string;
  expected: string;
}

export interface CsvValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  resolvedRows: number;
  readyRows: number;
  columnIssues: number;
  issues: CsvValidationIssue[];
  clean: boolean;
}

export interface CsvImportedTablePayload {
  id: string;
  fileName: string;
  tableName: string;
  tableDescription: string;
  delimiter: string;
  encoding: string;
  importedRows: number;
  skippedRows: number;
  valueContext?: CsvImportedColumnValueContext[];
}

export interface CsvImportCompletePayload {
  tables: CsvImportedTablePayload[];
  openSettings?: boolean;
}

export interface CreatedDataSourceResult {
  source: DataSourceCatalogItem;
  returnContext: DataSourceCreationReturnContext;
}

export interface NewDataSourceDraftBase {
  connector: DataSourceConnector | null;
  name: string;
  ownership: DataSourceOwnershipChoice;
}

export function emptyDatabaseFields(
  connector: DataSourceConnector,
): DatabaseConnectionFields {
  const defaultPort =
    connector === "postgres"
      ? "5432"
      : connector === "mysql"
        ? "3306"
        : connector === "mssql"
          ? "1433"
          : connector === "redshift"
            ? "5439"
            : "";

  return {
    host: "",
    port: defaultPort,
    username: "",
    password: "",
    database: "",
    ssl: true,
    authMethod: "password",
    account: "",
    role: "",
    warehouse: "",
    privateKey: "",
    passphrase: "",
    projectId: "",
    dataset: "",
  };
}

export function nextPrototypeDataSourceId(existing: DataSourceCatalogItem[]): string {
  let max = 0;
  for (const item of existing) {
    const match = /^ds-(?:created-)?(\d+)$/i.exec(item.id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  const stamp = Date.now().toString(36);
  return `ds-created-${stamp}-${max + 1}`;
}

export function nextPrototypeDataSourceName(existing: DataSourceCatalogItem[]): string {
  const used = new Set(
    existing
      .map((item) => item.name.trim().toLowerCase())
      .filter(Boolean),
  );
  for (let i = 1; i < 200; i += 1) {
    const candidate = `Data source name ${String(i).padStart(2, "0")}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  return `Data source name ${Date.now().toString().slice(-4)}`;
}
