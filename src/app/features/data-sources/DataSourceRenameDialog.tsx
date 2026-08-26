import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { parseDataSourceNameInput } from "@/app/features/permissions";

export interface DataSourceRenameDialogProps {
  open: boolean;
  currentName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function DataSourceRenameDialog({
  open,
  currentName,
  onOpenChange,
  onSave,
}: DataSourceRenameDialogProps) {
  const [draft, setDraft] = useState(currentName);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(currentName);
    setAttempted(false);
  }, [open, currentName]);

  const parsed = parseDataSourceNameInput(draft);
  const error = attempted && !parsed ? "Data Source name is required." : null;

  function handleSave() {
    setAttempted(true);
    if (!parsed) return;
    onSave(parsed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Data Source</DialogTitle>
          <DialogDescription>
            The catalog name updates immediately. Connected Constellations keep this
            Data Source by ID.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="data-source-rename">Data Source name</Label>
            <Input
              id="data-source-rename"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(error)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSave();
                }
              }}
            />
            {error ? (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }}>
                {error}
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" size="compact" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="compact" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
