import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import type {
  DataSourceHandoffConstellation,
  DataSourceHandoffProject,
} from "./constellationHandoff";
import { listConstellationsEligibleToConnectSource } from "./constellationHandoff";

function SelectableRow({
  selected,
  title,
  meta,
  onSelect,
}: {
  selected: boolean;
  title: string;
  meta?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-[var(--luxia-radius-control)] border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
        selected
          ? "border-[var(--luxia-border-focus)] bg-[var(--luxia-surface-selected,var(--luxia-surface-muted))]"
          : "border-[var(--luxia-border-subtle)] bg-[var(--luxia-surface-elevated)] hover:border-[var(--luxia-border-strong)]"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
          {title}
        </span>
        {meta ? (
          <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-secondary)]">
            {meta}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export interface CreateConstellationFromDataSourceDialogProps {
  open: boolean;
  sourceName: string;
  projects: DataSourceHandoffProject[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (projectId: string) => void;
}

export function CreateConstellationFromDataSourceDialog({
  open,
  sourceName,
  projects,
  onOpenChange,
  onConfirm,
}: CreateConstellationFromDataSourceDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) setSelectedId(null);
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!selectedId) return;
    onConfirm(selectedId);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Create new Constellation</DialogTitle>
          <DialogDescription>
            Choose a Project you can configure. {sourceName} stays independent of the
            Project and will be selected as a connected Data Source.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {projects.length === 0 ? (
            <p className="luxia-type-body-dense text-[var(--luxia-text-secondary)]" role="status">
              No Projects available. You need Project Owner or Manager access to create
              a Constellation.
            </p>
          ) : (
            <ul role="listbox" aria-label="Projects" className="space-y-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <SelectableRow
                    selected={selectedId === project.id}
                    title={project.name}
                    onSelect={() => setSelectedId(project.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="shrink-0">
          <Button type="button" variant="secondary" size="compact" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface ConnectDataSourceToConstellationDialogProps {
  open: boolean;
  sourceId: string;
  sourceName: string;
  constellations: DataSourceHandoffConstellation[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (constellationId: string) => void;
}

export function ConnectDataSourceToConstellationDialog({
  open,
  sourceId,
  sourceName,
  constellations,
  onOpenChange,
  onConfirm,
}: ConnectDataSourceToConstellationDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const eligible = useMemo(
    () => listConstellationsEligibleToConnectSource(sourceId, constellations),
    [sourceId, constellations],
  );

  function handleOpenChange(next: boolean) {
    if (!next) setSelectedId(null);
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!selectedId) return;
    onConfirm(selectedId);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add to existing Constellation</DialogTitle>
          <DialogDescription>
            Connect {sourceName} to a Constellation you can configure. Access stays on
            the Data Source.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {eligible.length === 0 ? (
            <p className="luxia-type-body-dense text-[var(--luxia-text-secondary)]" role="status">
              No eligible Constellations. You need Project Owner or Manager access, and
              this Data Source must not already be connected.
            </p>
          ) : (
            <ul role="listbox" aria-label="Constellations" className="space-y-2">
              {eligible.map((item) => (
                <li key={item.id}>
                  <SelectableRow
                    selected={selectedId === item.id}
                    title={item.name}
                    meta={item.projectName}
                    onSelect={() => setSelectedId(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="shrink-0">
          <Button type="button" variant="secondary" size="compact" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
