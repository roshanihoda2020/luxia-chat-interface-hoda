import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { DASHBOARD_CREATE_DENIED_MESSAGE } from "@/app/features/project-overview/dashboardAccess";

export type DashboardDestinationProject = {
  id: string;
  name: string;
};

type DocumentSaveToDashboardDialogProps = {
  open: boolean;
  documentTitle: string;
  /** Document origin Project when present. */
  sourceProjectId: string | null;
  eligibleProjects: DashboardDestinationProject[];
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (projectId: string) => void;
};

export function DocumentSaveToDashboardDialog({
  open,
  documentTitle,
  sourceProjectId,
  eligibleProjects,
  busy = false,
  onOpenChange,
  onConfirm,
}: DocumentSaveToDashboardDialogProps) {
  const projectFieldId = useId();

  const defaultProjectId = useMemo(() => {
    if (
      sourceProjectId
      && eligibleProjects.some((project) => project.id === sourceProjectId)
    ) {
      return sourceProjectId;
    }
    if (eligibleProjects.length === 1) return eligibleProjects[0].id;
    return "";
  }, [eligibleProjects, sourceProjectId]);

  const [projectId, setProjectId] = useState(defaultProjectId);

  useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId);
  }, [open, defaultProjectId]);

  const selected = eligibleProjects.find((project) => project.id === projectId) ?? null;
  const hasEligible = eligibleProjects.length > 0;
  const originLocked =
    Boolean(sourceProjectId)
    && eligibleProjects.some((project) => project.id === sourceProjectId)
    && eligibleProjects.length === 1;
  const canSave = hasEligible && Boolean(projectId) && !busy;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[24rem] gap-0 p-0 sm:max-w-[24rem]">
        <DialogHeader className="border-b px-5 py-4" style={{ borderColor: "var(--luxia-border-subtle)" }}>
          <DialogTitle>Save to Luxia</DialogTitle>
          <DialogDescription className="mt-1.5">
            Keep “{documentTitle.trim() || "Untitled document"}” in Luxia as a Project Dashboard output.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 py-4">
          {!hasEligible ? (
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
              role="status"
            >
              {DASHBOARD_CREATE_DENIED_MESSAGE}
            </p>
          ) : (
            <div className="min-w-0">
              <Label htmlFor={projectFieldId} className="luxia-type-caption mb-1.5 block font-semibold">
                Project
              </Label>
              {originLocked ? (
                <p
                  id={projectFieldId}
                  className="rounded-[6px] border px-3 py-2 luxia-type-body-dense"
                  style={{
                    borderColor: "var(--luxia-border-default)",
                    color: "var(--luxia-brand-primary)",
                    background: "color-mix(in srgb, white 88%, var(--luxia-opacity-brand-primary-08))",
                  }}
                >
                  {selected?.name ?? "Project"}
                </p>
              ) : (
                <Select
                  value={projectId || undefined}
                  onValueChange={setProjectId}
                  disabled={busy}
                >
                  <SelectTrigger id={projectFieldId} className="w-full" aria-required>
                    <SelectValue placeholder="Choose a Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p
                className="luxia-type-caption mt-2 leading-snug"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Appears as an output on the Project Dashboard.
              </p>
            </div>
          )}
        </div>

        <DialogFooter
          className="gap-2 border-t px-5 py-3.5 sm:gap-2"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSave}
            onClick={() => {
              if (!projectId) return;
              onConfirm(projectId);
            }}
          >
            {busy ? "Saving…" : "Save to Luxia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
