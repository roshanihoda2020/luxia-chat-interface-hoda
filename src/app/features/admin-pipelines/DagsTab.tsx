import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { ResultsCount } from "@/app/features/home/browserShared";
import { getEnabledActionTableLabels } from "./format";
import {
  AdminEmptyState,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableShell,
  AdminTruncateText,
} from "./adminTable";
import type { AdminDagMapping } from "./types";

/** Enabled Actions column is sized for up to three capability labels on one line. */
const COLS =
  "minmax(8.5rem,1.1fr) minmax(7.5rem,0.95fr) minmax(7rem,0.9fr) minmax(6.5rem,0.85fr) minmax(14rem,1.75fr) 3.25rem 2.5rem";

/** Informational capability tags — not interactive controls. */
const CAPABILITY_LABEL_CLASS =
  "h-5 max-w-full min-h-5 shrink-0 truncate rounded-[var(--luxia-radius-6)] border-0 bg-[var(--luxia-opacity-brand-secondary-08)] px-1.5 py-0 luxia-type-caption font-normal text-[var(--luxia-purple-70)] shadow-none";

export function DagsTab({
  rows,
  totalCount,
  filteredEmpty,
  getOrganizationName,
  getProjectName,
  onNew,
  onEdit,
  onDelete,
  onManageVariables,
}: {
  rows: AdminDagMapping[];
  totalCount: number;
  filteredEmpty: boolean;
  getOrganizationName: (id: string) => string;
  getProjectName: (id: string) => string;
  onNew: () => void;
  onEdit: (mapping: AdminDagMapping) => void;
  onDelete: (mapping: AdminDagMapping) => void;
  onManageVariables: (mapping: AdminDagMapping) => void;
}) {
  if (totalCount === 0) {
    return (
      <AdminEmptyState
        title="No DAG mappings yet"
        description="Map an Airflow DAG to a tenant project so it appears in the customer Project Pipelines view."
        action={
          <Button type="button" size="sm" onClick={onNew}>
            + New DAG mapping
          </Button>
        }
      />
    );
  }

  if (filteredEmpty) {
    return (
      <AdminEmptyState
        title="No mappings match these filters"
        description="Try another organization or project, or clear filters to see all mappings."
      />
    );
  }

  return (
    <div className="space-y-2">
      <ResultsCount>
        {rows.length} {rows.length === 1 ? "mapping" : "mappings"}
      </ResultsCount>
      <AdminTableShell columns={COLS} minWidth="56rem">
        <AdminTableHeader className="py-2">
          <AdminTableHeaderCell>DAG ID</AdminTableHeaderCell>
          <AdminTableHeaderCell>Display name</AdminTableHeaderCell>
          <AdminTableHeaderCell>Organization</AdminTableHeaderCell>
          <AdminTableHeaderCell>Project</AdminTableHeaderCell>
          <AdminTableHeaderCell>Enabled actions</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-center">Variables</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">
            <span className="sr-only">Actions</span>
          </AdminTableHeaderCell>
        </AdminTableHeader>
        {rows.map((row) => {
          const label = row.displayName || row.dagId;
          const orgName = getOrganizationName(row.organizationId);
          const projectName = getProjectName(row.projectId);
          const variableCount = row.attachedVariableIds.length;
          const actionLabels = getEnabledActionTableLabels(row.enabledActions);

          return (
            <AdminTableRow key={row.id} className="py-2">
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                  {row.dagId}
                </AdminTruncateText>
              </div>

              <div className="min-w-0">
                {row.displayName ? (
                  <AdminTruncateText className="luxia-type-body-small font-normal text-[var(--luxia-text-primary)]">
                    {row.displayName}
                  </AdminTruncateText>
                ) : (
                  <span className="luxia-type-body-small text-[var(--luxia-text-muted)]">
                    —
                  </span>
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
                {actionLabels.length === 0 ? (
                  <span className="luxia-type-caption text-[var(--luxia-text-muted)]">
                    None
                  </span>
                ) : (
                  <div className="flex max-h-[2.75rem] flex-wrap content-center gap-1 overflow-hidden">
                    {actionLabels.map((actionLabel) => (
                      <Badge
                        key={actionLabel}
                        variant="secondary"
                        className={CAPABILITY_LABEL_CLASS}
                      >
                        {actionLabel}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className="inline-block min-w-[1.25rem] text-center luxia-type-body-small tabular-nums text-[var(--luxia-text-secondary)]">
                      {variableCount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    {variableCount === 0
                      ? "No variables attached"
                      : variableCount === 1
                        ? "1 attached variable"
                        : `${variableCount} attached variables`}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex justify-end">
                <LuxiaEntityOptionsMenu
                  entityLabel={label}
                  entityType="DAG mapping"
                  ariaLabel={`Actions for ${label}`}
                  items={[
                    {
                      id: "manage-variables",
                      label: "Manage variables",
                      onSelect: () => onManageVariables(row),
                    },
                    {
                      id: "edit",
                      label: "Edit mapping",
                      onSelect: () => onEdit(row),
                    },
                    {
                      id: "delete",
                      label: "Delete mapping",
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
