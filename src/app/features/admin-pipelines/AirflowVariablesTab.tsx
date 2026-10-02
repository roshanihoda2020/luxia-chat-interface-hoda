import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ResultsCount } from "@/app/features/home/browserShared";
import type {
  AdminAirflowLoadState,
  AdminAirflowVariable,
  AdminVariableDeclaration,
} from "./types";
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

const COLS = "minmax(10rem,1.5fr) minmax(10rem,2fr) minmax(6rem,1fr) minmax(8rem,auto)";

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
    return <AdminLoadingState label="Loading Airflow variable inventory…" />;
  }

  if (airflowState === "unavailable") {
    return (
      <AdminErrorState
        title="Airflow inventory unavailable"
        description="Variable keys could not be loaded from Airflow via Luxia. Values are never exposed in this UI."
        action={
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (airflowState === "empty" || airflowVariables.length === 0) {
    return (
      <AdminEmptyState
        title="No Airflow variables discovered"
        description="When Airflow reports variable keys to Luxia, they appear here so you can declare them for tenant projects."
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
        description="Every discovered Airflow variable key already has at least one Luxia declaration. Turn off the filter to review all keys."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
        Keys and metadata only — Airflow variable values are never shown in Pipelines
        administration. The same key may be declared for more than one project.
      </p>
      <ResultsCount>
        {rows.length} {rows.length === 1 ? "variable key" : "variable keys"}
      </ResultsCount>
      <AdminTableShell columns={COLS} minWidth="44rem">
        <AdminTableHeader>
          <AdminTableHeaderCell>Key</AdminTableHeaderCell>
          <AdminTableHeaderCell>Description</AdminTableHeaderCell>
          <AdminTableHeaderCell>Declaration</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">Action</AdminTableHeaderCell>
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
              <div>
                {declared ? (
                  <Badge variant="outline" className="font-normal">
                    {count === 1 ? "Declared" : `Declared ×${count}`}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal">
                    Undeclared
                  </Badge>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onDeclare(row.key)}
                >
                  {declared ? "Declare for another project" : "Declare for project"}
                </Button>
              </div>
            </AdminTableRow>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
