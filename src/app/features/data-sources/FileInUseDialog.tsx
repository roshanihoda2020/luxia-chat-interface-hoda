import { AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import type { FileInUseDependency } from "./fileInUse";

export type FileInUseDialogProps = {
  open: boolean;
  fileName: string;
  dependencies: readonly FileInUseDependency[];
  onClose: () => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
};

export function FileInUseDialog({
  open,
  fileName,
  dependencies,
  onClose,
  onOpenConstellation,
}: FileInUseDialogProps) {
  const count = dependencies.length;
  const constellationWord = count === 1 ? "Constellation" : "Constellations";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,34rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-start gap-2">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-[var(--luxia-warning-90)]"
              aria-hidden
            />
            <span>This file is still in use</span>
          </DialogTitle>
          <DialogDescription className="break-words">
            <span className="break-words">{fileName}</span>
            {" "}
            backs {count} {constellationWord}. Remove it from them first, then
            delete it here.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <ul
            className="divide-y overflow-hidden rounded-[10px] border"
            style={{ borderColor: "var(--luxia-border-default)" }}
            aria-label={`Constellations using ${fileName}`}
          >
            {dependencies.map((item) => (
              <li
                key={item.constellationId}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                style={{ borderColor: "var(--luxia-border-subtle)" }}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="break-words luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {item.constellationName}
                  </p>
                  {item.projectName ? (
                    <p
                      className="mt-0.5 break-words luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      {item.projectName}
                    </p>
                  ) : null}
                </div>
                {onOpenConstellation && item.projectId ? (
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    className="shrink-0"
                    aria-label={`Open ${item.constellationName}`}
                    onClick={() => {
                      onClose();
                      onOpenConstellation(item.projectId, item.constellationId);
                    }}
                  >
                    Open
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
