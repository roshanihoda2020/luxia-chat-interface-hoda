import { ResultsCount } from "@/app/features/home/browserShared";
import type {
  AdminAirflowLoadState,
  AdminAirflowVariable,
  AdminVariableDeclaration,
} from "./types";
import {
  ADMIN_COL_ID,
  ADMIN_COL_STATUS_META,
  ADMIN_COL_TEXT,
  ADMIN_TABLE_MIN_WIDTH_INVENTORY,
  ADMIN_TABLE_ROW_ACTION_COL,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  isAirflowInventoryEmpty,
  AdminTableBadgeCell,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableRowAction,
  AdminTableRowActionCell,
  AdminTableRowActionHeaderCell,
  AdminTableShell,
  AdminTableStatusMeta,
  AdminTruncateText,
} from "./adminTable";

const COLS = [
  ADMIN_COL_ID,
  ADMIN_COL_TEXT,
  ADMIN_COL_STATUS_META,
  ADMIN_TABLE_ROW_ACTION_COL,
].join(" ");

export function AirflowVariablesTab({
  airflowVariables,
  declarations,
  airflowState,
  showUndeclaredOnly,
  onDeclare,
  onRetry,
}: {
  airflowVariables: AdminAirflowVariable[];
  declarations: AdminVariableDeclaration[];
  airflowState: AdminAirflowLoadState;
  showUndeclaredOnly: boolean;
  onDeclare: (key: string) => void;
  onRetry: () => void;
}) {
  if (airflowState === "loading") {
    return <AdminLoadingState label="Loading Airflow variables…" />;
  }

  if (airflowState === "unavailable") {
    return (
      <AdminErrorState
        title="Airflow inventory unavailable"
        description={
          <>
            <p>Variable keys couldn&apos;t be loaded from Airflow via Luxia.</p>
            <p>Airflow variable values are never exposed here.</p>
          </>
        }
        action={
          <AdminTableRowAction onClick={onRetry}>Retry</AdminTableRowAction>
        }
      />
    );
  }

  if (isAirflowInventoryEmpty(airflowState, airflowVariables.length)) {
    return (
      <AdminEmptyState
        title="No Airflow variables discovered"
        description="When Airflow reports variable keys to Luxia, they’ll appear here so you can declare them for tenant projects."
      />
    );
  }

  const declarationCounts = new Map<string, number>();
  for (const row of declarations) {
    declarationCounts.set(row.key, (declarationCounts.get(row.key) ?? 0) + 1);
  }

  const rows = airflowVariables.filter((row) => {
    if (!showUndeclaredOnly) return true;
    return (declarationCounts.get(row.key) ?? 0) === 0;
  });

  if (rows.length === 0) {
    return (
      <AdminEmptyState
        title="No undeclared variables"
        description="All discovered Airflow variables have already been declared. Turn off “Show only undeclared” to review the full inventory."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
        Keys and metadata only — Airflow variable values are never shown in Pipeline
        Admin. The same key may be declared for more than one project.
      </p>
      <ResultsCount>
        {rows.length} {rows.length === 1 ? "variable key" : "variable keys"}
      </ResultsCount>
      <AdminTableShell columns={COLS} minWidth={ADMIN_TABLE_MIN_WIDTH_INVENTORY}>
        <AdminTableHeader>
          <AdminTableHeaderCell>Key</AdminTableHeaderCell>
          <AdminTableHeaderCell>Description</AdminTableHeaderCell>
          <AdminTableHeaderCell>Declaration</AdminTableHeaderCell>
          <AdminTableRowActionHeaderCell>Action</AdminTableRowActionHeaderCell>
        </AdminTableHeader>
        {rows.map((row) => {
          const count = declarationCounts.get(row.key) ?? 0;
          const declared = count > 0;
          return (
            <AdminTableRow key={row.key}>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                  {row.key}
                </AdminTruncateText>
              </div>
              <div className="min-w-0">
                {row.description ? (
                  <AdminTruncateText className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
                    {row.description}
                  </AdminTruncateText>
                ) : (
                  <span className="luxia-type-body-small text-[var(--luxia-text-muted)]">
                    No description
                  </span>
                )}
              </div>
              <AdminTableBadgeCell>
                {declared ? (
                  <AdminTableStatusMeta
                    tone="success"
                    title={
                      count === 1
                        ? "Declared for one project"
                        : `Declared for ${count} projects`
                    }
                  >
                    {count === 1 ? "Declared" : `Declared ×${count}`}
                  </AdminTableStatusMeta>
                ) : (
                  <AdminTableStatusMeta tone="neutral">Undeclared</AdminTableStatusMeta>
                )}
              </AdminTableBadgeCell>
              <AdminTableRowActionCell>
                <AdminTableRowAction onClick={() => onDeclare(row.key)}>
                  {declared ? "Declare for another project" : "Declare for project"}
                </AdminTableRowAction>
              </AdminTableRowActionCell>
            </AdminTableRow>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
