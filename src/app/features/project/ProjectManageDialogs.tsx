import { useEffect, useId, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import type { HomeProjectCard } from "./types";

export type ProjectManageMode = "edit" | "delete" | "archive";

export interface ProjectDetailsDraft {
  name: string;
  description: string;
}

const EDIT_DIALOG_CONTENT_CLASS =
  "w-full min-w-0 max-w-[min(32rem,calc(100vw-2rem))] gap-4 overflow-x-hidden sm:max-w-[min(32rem,calc(100vw-2rem))]";

function restoreProjectOptionsFocus(projectName: string | undefined) {
  if (!projectName) return;
  const label = `Project options for ${projectName}`;
  window.requestAnimationFrame(() => {
    const trigger = document.querySelector<HTMLElement>(
      `button[aria-label="${CSS.escape(label)}"]`,
    );
    trigger?.focus();
  });
}

interface EditProjectDialogProps {
  open: boolean;
  project: HomeProjectCard | null;
  onClose: () => void;
  onSave: (projectId: string, details: ProjectDetailsDraft) => void;
}

export function EditProjectDialog({
  open,
  project,
  onClose,
  onSave,
}: EditProjectDialogProps) {
  const nameId = useId();
  const descriptionId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open && project) {
      setName(project.name);
      setDescription(project.description ?? "");
      const frame = window.requestAnimationFrame(() => {
        nameRef.current?.focus();
        nameRef.current?.select();
      });
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [open, project]);

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const initialName = project?.name.trim() ?? "";
  const initialDescription = (project?.description ?? "").trim();
  const unchanged = trimmedName === initialName && trimmedDescription === initialDescription;
  const canSave = trimmedName.length > 0 && !unchanged;

  function handleClose() {
    const projectName = project?.name;
    onClose();
    restoreProjectOptionsFocus(projectName);
  }

  function handleSave() {
    if (!project || !canSave) return;
    onSave(project.id, {
      name: trimmedName,
      description: trimmedDescription,
    });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className={EDIT_DIALOG_CONTENT_CLASS}>
        <DialogHeader className="min-w-0 pr-10 text-left">
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="flex min-w-0 w-full flex-col gap-4 overflow-x-hidden px-6 py-4">
          <div className="flex min-w-0 w-full flex-col gap-2">
            <Label htmlFor={nameId}>Project name</Label>
            <Input
              ref={nameRef}
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              className="box-border w-full max-w-full min-w-0"
              aria-invalid={trimmedName.length === 0}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          <div className="flex min-w-0 w-full flex-col gap-2">
            <Label htmlFor={descriptionId}>Description (optional)</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a short description..."
              rows={4}
              className="box-border min-h-24 w-full max-w-full min-w-0 resize-y"
            />
          </div>
        </div>

        <DialogFooter className="min-w-0 w-full">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use EditProjectDialog */
export const EditProjectDetailsDialog = EditProjectDialog;

interface ArchiveProjectDialogProps {
  open: boolean;
  project: HomeProjectCard | null;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
}

export function ArchiveProjectDialog({
  open,
  project,
  onClose,
  onConfirm,
}: ArchiveProjectDialogProps) {
  function handleClose() {
    const projectName = project?.name;
    onClose();
    restoreProjectOptionsFocus(projectName);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <AlertDialogContent className="w-full min-w-0 max-w-[min(32rem,calc(100vw-2rem))] overflow-x-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {project ? `Archive ${project.name}?` : "Archive Project?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This Project will be removed from active Projects and can be restored
            later. It is not permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="text-white hover:opacity-90"
            style={{ background: "var(--luxia-error)" }}
            onClick={() => {
              if (!project) return;
              onConfirm(project.id);
              handleClose();
            }}
          >
            Archive Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteProjectDialogProps {
  open: boolean;
  project: HomeProjectCard | null;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
}

export function DeleteProjectDialog({
  open,
  project,
  onClose,
  onConfirm,
}: DeleteProjectDialogProps) {
  function handleClose() {
    const projectName = project?.name;
    onClose();
    restoreProjectOptionsFocus(projectName);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <AlertDialogContent className="w-full min-w-0 max-w-[min(32rem,calc(100vw-2rem))] overflow-x-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this Project removes access to the Project and its associated Galaxy
            and Constellations. This action cannot be undone from the Luxia interface.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="text-white hover:opacity-90"
            style={{ background: "var(--luxia-error)" }}
            onClick={() => {
              if (!project) return;
              onConfirm(project.id);
              handleClose();
            }}
          >
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ProjectManageDialogsProps {
  mode: ProjectManageMode | null;
  project: HomeProjectCard | null;
  onClose: () => void;
  onEditDetails: (projectId: string, details: ProjectDetailsDraft) => void;
  onArchive: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectManageDialogs({
  mode,
  project,
  onClose,
  onEditDetails,
  onArchive,
  onDelete,
}: ProjectManageDialogsProps) {
  return (
    <>
      <EditProjectDialog
        open={mode === "edit"}
        project={project}
        onClose={onClose}
        onSave={onEditDetails}
      />
      <ArchiveProjectDialog
        open={mode === "archive"}
        project={project}
        onClose={onClose}
        onConfirm={onArchive}
      />
      <DeleteProjectDialog
        open={mode === "delete"}
        project={project}
        onClose={onClose}
        onConfirm={onDelete}
      />
    </>
  );
}
