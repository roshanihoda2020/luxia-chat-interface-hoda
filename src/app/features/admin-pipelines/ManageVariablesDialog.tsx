import { useMemo, useState } from "react";
import { Link2, Link2Off, Plus } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ADMIN_VARIABLE_TYPE_LABELS } from "./format";
import type { AdminDagMapping, AdminVariableDeclaration } from "./types";

export interface ManageVariablesDialogProps {
  open: boolean;
  mapping: AdminDagMapping | null;
  organizationName: string;
  projectName: string;
  /** Variables declared for the same org + project only. */
  projectVariables: AdminVariableDeclaration[];
  onOpenChange: (open: boolean) => void;
  onAttach: (variableId: string) => Promise<void>;
  onDetach: (variableId: string) => Promise<void>;
  onCreateVariable: () => void;
}

/** Desktop: Variable (flex) | Type | Status | Action */
const DESKTOP_COLS =
  "minmax(0,1fr) 5.75rem 7.25rem 6.5rem";

const ACTION_BUTTON_CLASS =
  "h-8 min-h-8 w-[5.75rem] justify-center gap-1 px-2 luxia-type-caption font-medium shadow-none";

export function ManageVariablesDialog({
  open,
  mapping,
  organizationName,
  projectName,
  projectVariables,
  onOpenChange,
  onAttach,
  onDetach,
  onCreateVariable,
}: ManageVariablesDialogProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!mapping) return [];
    const attached = new Set(mapping.attachedVariableIds);
    return [...projectVariables].sort((a, b) => {
      const aOn = attached.has(a.id) ? 0 : 1;
      const bOn = attached.has(b.id) ? 0 : 1;
      if (aOn !== bOn) return aOn - bOn;
      return a.key.localeCompare(b.key);
    });
  }, [mapping, projectVariables]);

  const pipelineLabel = mapping?.displayName || mapping?.dagId || "this pipeline";

  async function handleToggle(variableId: string, attached: boolean) {
    if (!mapping) return;
    setBusyId(variableId);
    try {
      if (attached) await onDetach(variableId);
      else await onAttach(variableId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,42rem)] w-[min(100%,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle>Manage variables</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1">
              <p className="luxia-type-body-dense text-[var(--luxia-purple-10)]">
                Attach declared variables from this project to{" "}
                <span className="font-medium text-[var(--luxia-text-inverse)]">
                  {pipelineLabel}
                </span>
                .
              </p>
              <p className="luxia-type-caption text-[var(--luxia-purple-20)] opacity-90">
                {organizationName} · {projectName}
                {mapping ? ` · ${mapping.dagId}` : ""}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 luxia-scrollbar">
          {rows.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-[var(--luxia-radius-12)] border border-dashed border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] px-4 py-8">
              <p className="luxia-type-body font-medium text-[var(--luxia-text-primary)]">
                No variables available
              </p>
              <p className="max-w-md luxia-type-body-small text-[var(--luxia-text-secondary)]">
                Declare a variable for this project before attaching it to this pipeline.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onCreateVariable();
                }}
              >
                <Plus size={14} strokeWidth={2} aria-hidden className="shrink-0" />
                New variable
              </Button>
            </div>
          ) : (
            <div
              className="luxia-settings-table-surface overflow-hidden"
              role="table"
              aria-label="Project variables"
            >
              {/* Sticky header while the variable list scrolls */}
              <div
                className="sticky top-0 z-[1] hidden border-b border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-section-bg)] px-3.5 py-2 sm:grid sm:items-center sm:gap-x-3"
                style={{ gridTemplateColumns: DESKTOP_COLS }}
                role="row"
              >
                <div
                  className="luxia-type-caption font-semibold uppercase tracking-wide text-[var(--luxia-text-muted)]"
                  role="columnheader"
                >
                  Variable
                </div>
                <div
                  className="luxia-type-caption font-semibold uppercase tracking-wide text-[var(--luxia-text-muted)]"
                  role="columnheader"
                >
                  Type
                </div>
                <div
                  className="luxia-type-caption font-semibold uppercase tracking-wide text-[var(--luxia-text-muted)]"
                  role="columnheader"
                >
                  Status
                </div>
                <div
                  className="text-right luxia-type-caption font-semibold uppercase tracking-wide text-[var(--luxia-text-muted)]"
                  role="columnheader"
                >
                  Action
                </div>
              </div>

              <div role="rowgroup">
                {rows.map((variable) => {
                  const attached = Boolean(
                    mapping?.attachedVariableIds.includes(variable.id),
                  );
                  const busy = busyId === variable.id;
                  const description =
                    variable.label && variable.label !== variable.key
                      ? variable.label
                      : variable.description || null;
                  const typeLabel = ADMIN_VARIABLE_TYPE_LABELS[variable.type];

                  return (
                    <div
                      key={variable.id}
                      role="row"
                      className="border-b border-[var(--luxia-border-subtle)] px-3.5 py-3 last:border-b-0 hover:bg-[var(--luxia-surface-subtle)] sm:grid sm:items-center sm:gap-x-3"
                      style={{ gridTemplateColumns: DESKTOP_COLS }}
                    >
                      <div className="min-w-0" role="cell">
                        <p className="truncate luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
                          {variable.key}
                        </p>
                        {description ? (
                          <p className="mt-0.5 truncate luxia-type-caption text-[var(--luxia-text-muted)]">
                            {description}
                          </p>
                        ) : null}
                        {variable.sensitive ? (
                          <p className="mt-0.5 luxia-type-caption text-[var(--luxia-text-muted)]">
                            Sensitive
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-2 min-w-0 sm:mt-0" role="cell">
                        <div className="flex items-center gap-2 sm:block">
                          <span className="luxia-type-caption text-[var(--luxia-text-muted)] sm:hidden">
                            Type:
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-6 max-w-full truncate px-2 font-normal text-[var(--luxia-text-secondary)]"
                          >
                            {typeLabel}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-2 min-w-0 sm:mt-0" role="cell">
                        <div className="flex items-center gap-2 sm:block">
                          <span className="luxia-type-caption text-[var(--luxia-text-muted)] sm:hidden">
                            Status:
                          </span>
                          <Badge
                            variant={attached ? "default" : "outline"}
                            className={
                              attached
                                ? "h-6 border border-[var(--luxia-settings-tab-active-border)] bg-[var(--luxia-settings-tab-active-bg)] px-2 font-normal text-[var(--luxia-settings-tab-active-text)] hover:bg-[var(--luxia-settings-tab-active-bg)]"
                                : "h-6 px-2 font-normal text-[var(--luxia-text-secondary)]"
                            }
                          >
                            {attached ? "Attached" : "Not attached"}
                          </Badge>
                        </div>
                      </div>

                      <div
                        className="mt-3 flex sm:mt-0 sm:justify-end"
                        role="cell"
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          className={
                            attached
                              ? ACTION_BUTTON_CLASS
                              : `${ACTION_BUTTON_CLASS} border-[var(--luxia-purple-50)] text-[var(--luxia-purple-70)] hover:bg-[var(--luxia-opacity-brand-secondary-08)] hover:text-[var(--luxia-purple-70)]`
                          }
                          onClick={() => handleToggle(variable.id, attached)}
                          aria-label={
                            attached
                              ? `Detach ${variable.key}`
                              : `Attach ${variable.key}`
                          }
                        >
                          {busy ? (
                            "…"
                          ) : attached ? (
                            <>
                              <Link2Off size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
                              Detach
                            </>
                          ) : (
                            <>
                              <Link2 size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
                              Attach
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-[var(--luxia-border-subtle)] px-6 py-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
