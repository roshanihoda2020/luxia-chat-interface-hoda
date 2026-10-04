import { PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ResultsCount } from "@/app/features/home/browserShared";
import { ADMIN_VARIABLE_TYPE_LABELS } from "./format";
import {
  ADMIN_COL_COUNT,
  ADMIN_COL_ENTITY,
  ADMIN_COL_ID,
  ADMIN_COL_META,
  ADMIN_COL_TEXT,
  ADMIN_TABLE_INLINE_ACTIONS_COL,
  ADMIN_TABLE_MIN_WIDTH_MAPPINGS,
  AdminEmptyState,
  AdminTableBadgeCell,
  AdminTableCountMeta,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableIconAction,
  AdminTableInlineActions,
  AdminTableRow,
  AdminTableSensitiveMeta,
  AdminTableShell,
  AdminTableTypeMeta,
  AdminTruncateText,
} from "./adminTable";
import type { AdminDagMapping, AdminVariableDeclaration } from "./types";

const COLS = [
  ADMIN_COL_ID,
  ADMIN_COL_TEXT,
  ADMIN_COL_META,
  ADMIN_COL_META,
  ADMIN_COL_ENTITY,
  ADMIN_COL_ENTITY,
  ADMIN_COL_COUNT,
  ADMIN_TABLE_INLINE_ACTIONS_COL,
].join(" ");

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
        description="Declare variables customers may read or change. Sensitive Airflow values are never shown in Pipeline Admin."
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
      <AdminTableShell columns={COLS} minWidth={ADMIN_TABLE_MIN_WIDTH_MAPPINGS}>
        <AdminTableHeader>
          <AdminTableHeaderCell>Key</AdminTableHeaderCell>
          <AdminTableHeaderCell>Label</AdminTableHeaderCell>
          <AdminTableHeaderCell>Type</AdminTableHeaderCell>
          <AdminTableHeaderCell>Sensitive</AdminTableHeaderCell>
          <AdminTableHeaderCell>Organization</AdminTableHeaderCell>
          <AdminTableHeaderCell>Project</AdminTableHeaderCell>
          <AdminTableHeaderCell>DAGs</AdminTableHeaderCell>
          <AdminTableHeaderCell className="text-right">Actions</AdminTableHeaderCell>
        </AdminTableHeader>
        {rows.map((row) => {
          const attachedDags = dagsForVariable(row.id);
          const orgName = getOrganizationName(row.organizationId);
          const projectName = getProjectName(row.projectId);
          const dagTooltip =
            attachedDags.length === 0
              ? undefined
              : attachedDags.length === 1
                ? "1 attached DAG"
                : `${attachedDags.length} attached DAGs`;
          return (
            <AdminTableRow key={row.id}>
              <div className="min-w-0">
                <AdminTruncateText className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                  {row.key}
                </AdminTruncateText>
              </div>
              <div className="min-w-0">
                {row.label ? (
                  <AdminTruncateText
                    className="luxia-type-body-small text-[var(--luxia-text-secondary)]"
                    tooltip={
                      row.description?.trim()
                        ? row.description.trim()
                        : undefined
                    }
                  >
                    {row.label}
                  </AdminTruncateText>
                ) : (
                  <span className="luxia-type-body-small text-[var(--luxia-text-muted)]">—</span>
                )}
              </div>
              <AdminTableBadgeCell>
                <AdminTableTypeMeta label={ADMIN_VARIABLE_TYPE_LABELS[row.type]} />
              </AdminTableBadgeCell>
              <AdminTableBadgeCell>
                <AdminTableSensitiveMeta sensitive={row.sensitive} />
              </AdminTableBadgeCell>
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
              <div>
                <AdminTableCountMeta
                  count={attachedDags.length}
                  tooltip={
                    dagTooltip
                      ? `${dagTooltip}: ${attachedDags.map((d) => d.displayName || d.dagId).join(", ")}`
                      : undefined
                  }
                />
              </div>
              <AdminTableInlineActions>
                <AdminTableIconAction
                  label="Edit variable"
                  onClick={() => onEdit(row)}
                >
                  <PencilLine size={16} strokeWidth={1.75} aria-hidden />
                </AdminTableIconAction>
                <AdminTableIconAction
                  label="Delete variable"
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
