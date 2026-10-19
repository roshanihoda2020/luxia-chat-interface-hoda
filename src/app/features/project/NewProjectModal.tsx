import { useEffect, useId, useState } from "react";
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

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export function NewProjectModal({ open, onClose, onCreate }: NewProjectModalProps) {
  const nameId = useId();
  const descriptionId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate(trimmedName, description.trim());
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>Project name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              aria-required
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={descriptionId}>Description (optional)</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description..."
              rows={3}
              className="min-h-20 resize-y"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
