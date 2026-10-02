import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { ResultsCount } from "@/app/features/home/browserShared";
import { ADMIN_VARIABLE_TYPE_LABELS } from "./format";
import {
  AdminEmptyState,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableShell,
  AdminTruncateText,
} from "./adminTable";
import type { AdminDagMapping, AdminVariableDeclaration } from "./types";

const COLS =
  "minmax(9rem,1.45fr) minmax(7rem,1.1fr) 5.5rem 5rem minmax(7rem,1.1fr) minmax(6rem,1fr) minmax(4.5rem,0.85fr) minmax(3.5rem,auto)";

export function VariablesTab({
  rows,
  totalCount,
  filteredEmpty,
  getOrganizationName,
  getProjectName,
  dagsForVariable,
  onNew,
  onEdit,
  onDelete,
}: {
  rows: AdminVariableDeclaration[];
  totalCount: number;
  filteredEmpty: boolean;
  getOrganizationName: (id: string) => string;
  getProjectName: (id: string) => string;
  dagsForVariable: (variableId: string) => AdminDagMapping[];
  onNew: () => void;
  onEdit: (variable: AdminVariableDeclaration) => void;
  onDelete: (variable: AdminVariableDeclaration) => void;
}) {
  if (totalCount === 0) {
    return (
      <AdminEmptyState
        title="No variables declared"
        description="Declare variables customers may read or change. Sensitive Airflow values are never shown in administration."
        action={
          <Button type="button" size="sm" onClick={onNew}>
            + New variable
          </Button>
        }
      />
    );
  }

  if (filteredEmpty) {
    return (
      <AdminEmptyState
        title="No variables match these filters"
        description="Try another organization, project, or search term."
      />
    );
  }

  return (
    <div className="space-y-3">
      <ResultsCount>
        {rows.length} {rows.length === 1 ? "variable" : "variables"}
      </ResultsCount>
      <AdminTableShell columns={COLS} minWidth="58rem">
        <AdminTableHeader>
          <AdminTableHeaderCell>Key</AdminTableHeaderCell>
          <AdminTableHeaderCell>Label</AdminTableHeaderCell>
          <AdminTableHeaderCell>Type</AdminTableHeaderCell>
          <AdminTableHeaderCell>Sensitive</AdminTableHeaderCell>
          <AdminTableHeaderCell>Organization</AdminTableHeaderCell>
          <AdminTableHeaderCell>Project</AdminTableHeaderCell>
          <AdminTableHeaderCell>DAGs</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">
            <span className="sr-only">Actions</span>
          </AdminTableHeaderCell>
        </AdminTableHeader>
        {rows.map((row) => {
          const attachedDags = dagsForVariable(row.id);
          const orgName = getOrganizationName(row.organizationId);
          const projectName = getProjectName(row.projectId);
          return (
            <AdminTableRow key={row.id}>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                  {row.key}
                </AdminTruncateText>
              </div>
              <div className="min-w-0">
                {row.label ? (
                  <AdminTruncateText className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
                    {row.label}
                  </AdminTruncateText>
                ) : (
                  <span className="luxia-type-body-small text-[var(--luxia-text-muted)]">—</span>
                )}
              </div>
              <div>
                <Badge variant="outline" className="font-normal">
                  {ADMIN_VARIABLE_TYPE_LABELS[row.type]}
                </Badge>
              </div>
              <div>
                {row.sensitive ? (
                  <Badge variant="secondary" className="font-normal">
                    Yes
                  </Badge>
                ) : (
                  <span className="luxia-type-caption text-[var(--luxia-text-muted)]">No</span>
                )}
              </div>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
                  {orgName}
                </AdminTruncateText>
              </div>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
                  {projectName}
                </AdminTruncateText>
              </div>
              <div className="min-w-0">
                {attachedDags.length === 0 ? (
                  <span className="luxia-type-caption text-[var(--luxia-text-muted)]">—</span>
                ) : (
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-default font-normal tabular-nums">
                        {attachedDags.length}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {attachedDags.map((d) => d.displayName || d.dagId).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex justify-end">
                <LuxiaEntityOptionsMenu
                  entityLabel={row.key}
                  entityType="variable"
                  ariaLabel={`Actions for ${row.key}`}
                  items={[
                    {
                      id: "edit",
                      label: "Edit variable",
                      onSelect: () => onEdit(row),
                    },
                    {
                      id: "delete",
                      label: "Delete variable",
                      destructive: true,
                      separatorBefore: true,
                      onSelect: () => onDelete(row),
                    },
                  ]}
                />
              </div>
            </AdminTableRow>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
