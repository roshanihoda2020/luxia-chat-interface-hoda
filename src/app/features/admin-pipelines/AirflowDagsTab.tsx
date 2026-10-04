import { ResultsCount } from "@/app/features/home/browserShared";
import type { AdminAirflowDag, AdminAirflowLoadState, AdminDagMapping } from "./types";
import {
  ADMIN_COL_ID,
  ADMIN_COL_META,
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
  ADMIN_COL_META,
  ADMIN_COL_STATUS_META,
  ADMIN_TABLE_ROW_ACTION_COL,
].join(" ");

export function AirflowDagsTab({
  dags,
  mappings,
  airflowState,
  showUnmappedOnly,
  onMapToProject,
  onRetry,
}: {
  dags: AdminAirflowDag[];
  mappings: AdminDagMapping[];
  airflowState: AdminAirflowLoadState;
  showUnmappedOnly: boolean;
  onMapToProject: (dagId: string) => void;
  onRetry: () => void;
}) {
  if (airflowState === "loading") {
    return <AdminLoadingState label="Loading Airflow DAGs…" />;
  }

  if (airflowState === "unavailable") {
    return (
      <AdminErrorState
        title="Airflow inventory unavailable"
        description={
          <>
            <p>
              DAG inventory couldn&apos;t be loaded from Airflow via Luxia. Browser clients
              never talk to Airflow directly — retry when the admin API is healthy.
            </p>
          </>
        }
        action={
          <AdminTableRowAction onClick={onRetry}>Retry</AdminTableRowAction>
        }
      />
    );
  }

  if (isAirflowInventoryEmpty(airflowState, dags.length)) {
    return (
      <AdminEmptyState
        title="No Airflow DAGs discovered"
        description="When Airflow reports DAGs to Luxia, they’ll appear here so you can map them to tenant projects."
      />
    );
  }

  const counts = new Map<string, number>();
  for (const m of mappings) {
    counts.set(m.dagId, (counts.get(m.dagId) ?? 0) + 1);
  }

  const rows = dags.filter((dag) => {
    if (!showUnmappedOnly) return true;
    return (counts.get(dag.dagId) ?? 0) === 0;
  });

  if (rows.length === 0) {
    return (
      <AdminEmptyState
        title="No unmapped DAGs"
        description="All discovered Airflow DAGs are already mapped. Turn off “Show only unmapped” to review the full inventory."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
        Live inventory from Airflow via the Luxia admin API. Status is informational — pause and
        resume are not controlled here.
      </p>
      <ResultsCount>
        {rows.length} {rows.length === 1 ? "DAG" : "DAGs"}
      </ResultsCount>
      <AdminTableShell columns={COLS} minWidth={ADMIN_TABLE_MIN_WIDTH_INVENTORY}>
        <AdminTableHeader>
          <AdminTableHeaderCell>DAG ID</AdminTableHeaderCell>
          <AdminTableHeaderCell>Description</AdminTableHeaderCell>
          <AdminTableHeaderCell>Status</AdminTableHeaderCell>
          <AdminTableHeaderCell>Mapping</AdminTableHeaderCell>
          <AdminTableRowActionHeaderCell>Action</AdminTableRowActionHeaderCell>
        </AdminTableHeader>
        {rows.map((dag) => {
          const count = counts.get(dag.dagId) ?? 0;
          const mapped = count > 0;
          return (
            <AdminTableRow key={dag.dagId}>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                  {dag.dagId}
                </AdminTruncateText>
              </div>
              <div className="min-w-0">
                {dag.description ? (
                  <AdminTruncateText className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
                    {dag.description}
                  </AdminTruncateText>
                ) : (
                  <span className="luxia-type-body-small text-[var(--luxia-text-muted)]">
                    No description
                  </span>
                )}
              </div>
              <AdminTableBadgeCell>
                <AdminTableStatusMeta
                  tone={dag.status === "active" ? "success" : "warning"}
                  title={dag.status === "active" ? "Active in Airflow" : "Paused in Airflow"}
                >
                  {dag.status === "active" ? "Active" : "Paused"}
                </AdminTableStatusMeta>
              </AdminTableBadgeCell>
              <AdminTableBadgeCell>
                {mapped ? (
                  <AdminTableStatusMeta
                    tone="config"
                    title={
                      count === 1
                        ? "Mapped to one tenant project"
                        : `Mapped to ${count} tenant projects`
                    }
                  >
                    {count === 1 ? "Mapped" : `Mapped ×${count}`}
                  </AdminTableStatusMeta>
                ) : (
                  <AdminTableStatusMeta tone="neutral">Unmapped</AdminTableStatusMeta>
                )}
              </AdminTableBadgeCell>
              <AdminTableRowActionCell>
                <AdminTableRowAction onClick={() => onMapToProject(dag.dagId)}>
                  {mapped ? "Map to another project" : "Map to project"}
                </AdminTableRowAction>
              </AdminTableRowActionCell>
            </AdminTableRow>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
