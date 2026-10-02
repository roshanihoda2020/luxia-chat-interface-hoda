import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ResultsCount } from "@/app/features/home/browserShared";
import type { AdminAirflowDag, AdminAirflowLoadState, AdminDagMapping } from "./types";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableShell,
  AdminTruncateText,
} from "./adminTable";

const COLS =
  "minmax(9rem,1.4fr) minmax(10rem,2fr) 5.5rem minmax(6rem,1fr) minmax(8rem,auto)";

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
    return <AdminLoadingState label="Loading Airflow DAG inventory…" />;
  }

  if (airflowState === "unavailable") {
    return (
      <AdminErrorState
        title="Airflow inventory unavailable"
        description="Luxia could not reach the Airflow inventory service. Browser clients never talk to Airflow directly — retry when the admin API is healthy."
        action={
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (airflowState === "empty" || dags.length === 0) {
    return (
      <AdminEmptyState
        title="No Airflow DAGs discovered"
        description="When Airflow reports DAGs to Luxia, they appear here for mapping into tenant projects."
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
        description="Every discovered DAG already has at least one tenant mapping. Turn off the filter to review mapped inventory."
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
      <AdminTableShell columns={COLS} minWidth="52rem">
        <AdminTableHeader>
          <AdminTableHeaderCell>DAG ID</AdminTableHeaderCell>
          <AdminTableHeaderCell>Description</AdminTableHeaderCell>
          <AdminTableHeaderCell>Status</AdminTableHeaderCell>
          <AdminTableHeaderCell>Mapping</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">Action</AdminTableHeaderCell>
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
              <div>
                <Badge
                  variant={dag.status === "active" ? "default" : "secondary"}
                  className="font-normal capitalize"
                >
                  {dag.status === "active" ? "Active" : "Paused"}
                </Badge>
              </div>
              <div>
                {mapped ? (
                  <Badge variant="outline" className="font-normal">
                    {count === 1 ? "Mapped" : `Mapped ×${count}`}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal">
                    Unmapped
                  </Badge>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onMapToProject(dag.dagId)}
                >
                  {mapped ? "Map to another project" : "Map to project"}
                </Button>
              </div>
            </AdminTableRow>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
