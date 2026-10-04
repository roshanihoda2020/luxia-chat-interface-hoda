import { Link2, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ResultsCount } from "@/app/features/home/browserShared";
import { getEnabledActionTableLabels } from "./format";
import {
  ADMIN_COL_CHIPS,
  ADMIN_COL_COUNT,
  ADMIN_COL_ENTITY,
  ADMIN_COL_ID,
  ADMIN_COL_TEXT_SECONDARY,
  ADMIN_TABLE_INLINE_ACTIONS_COL,
  ADMIN_TABLE_MIN_WIDTH_MAPPINGS,
  AdminEmptyState,
  AdminTableBadgeCell,
  AdminTableCapabilityMeta,
  AdminTableCountMeta,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableIconAction,
  AdminTableInlineActions,
  AdminTableRow,
  AdminTableShell,
  AdminTruncateText,
} from "./adminTable";
import type { AdminDagMapping } from "./types";

const COLS = [
  ADMIN_COL_ID,
  ADMIN_COL_TEXT_SECONDARY,
  ADMIN_COL_ENTITY,
  ADMIN_COL_ENTITY,
  ADMIN_COL_CHIPS,
  ADMIN_COL_COUNT,
  ADMIN_TABLE_INLINE_ACTIONS_COL,
].join(" ");

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
      <AdminTableShell columns={COLS} minWidth={ADMIN_TABLE_MIN_WIDTH_MAPPINGS}>
        <AdminTableHeader>
          <AdminTableHeaderCell>DAG ID</AdminTableHeaderCell>
          <AdminTableHeaderCell>Display name</AdminTableHeaderCell>
          <AdminTableHeaderCell>Organization</AdminTableHeaderCell>
          <AdminTableHeaderCell>Project</AdminTableHeaderCell>
          <AdminTableHeaderCell>Enabled actions</AdminTableHeaderCell>
          <AdminTableHeaderCell>Variables</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">Actions</AdminTableHeaderCell>
        </AdminTableHeader>
        {rows.map((row) => {
          const orgName = getOrganizationName(row.organizationId);
          const projectName = getProjectName(row.projectId);
          const variableCount = row.attachedVariableIds.length;
          const actionLabels = getEnabledActionTableLabels(row.enabledActions);

          return (
            <AdminTableRow key={row.id}>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                  {row.dagId}
                </AdminTruncateText>
              </div>

              <div className="min-w-0">
                {row.displayName ? (
                  <AdminTruncateText
                    className="luxia-type-body-small font-normal text-[var(--luxia-text-primary)]"
                    tooltip={
                      row.description?.trim()
                        ? row.description.trim()
                        : undefined
                    }
                  >
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

              <AdminTableBadgeCell>
                {actionLabels.length === 0 ? (
                  <span className="luxia-type-caption text-[var(--luxia-text-muted)]">
                    None
                  </span>
                ) : (
                  <div className="flex max-h-[2.75rem] min-w-0 flex-wrap content-center gap-1 overflow-hidden">
                    {actionLabels.map((actionLabel) => (
                      <AdminTableCapabilityMeta
                        key={actionLabel}
                        label={actionLabel}
                      />
                    ))}
                  </div>
                )}
              </AdminTableBadgeCell>

              <div>
                <AdminTableCountMeta
                  count={variableCount}
                  emptyLabel="0"
                  emptyTooltip="No variables attached"
                  tooltip={
                    variableCount === 1
                      ? "1 attached variable"
                      : `${variableCount} attached variables`
                  }
                />
              </div>

              <AdminTableInlineActions>
                <AdminTableIconAction
                  label="Manage variables"
                  onClick={() => onManageVariables(row)}
                >
                  <Link2 size={16} strokeWidth={1.75} aria-hidden />
                </AdminTableIconAction>
                <AdminTableIconAction
                  label="Edit mapping"
                  onClick={() => onEdit(row)}
                >
                  <PencilLine size={16} strokeWidth={1.75} aria-hidden />
                </AdminTableIconAction>
                <AdminTableIconAction
                  label="Delete mapping"
                  destructive
                  onClick={() => onDelete(row)}
                >
                  <Trash2 size={16} strokeWidth={1.75} aria-hidden />
                </AdminTableIconAction>
              </AdminTableInlineActions>
            </AdminTableRow>
          );
        })}
      </AdminTableShell>
    </div>
  );
}
