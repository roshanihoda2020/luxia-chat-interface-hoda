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
import { FilterField } from "@/app/features/home/browserShared";
import { isGoogleSheetLink } from "./googleSheetImport";

export type GoogleSheetImportDialogProps = {
  open: boolean;
  sourceName: string;
  ownershipLabel: string;
  importing?: boolean;
  onBack: () => void;
  onCancel: () => void;
  onImport: (link: string) => void;
};

export function GoogleSheetImportDialog({
  open,
  sourceName,
  ownershipLabel,
  importing = false,
  onBack,
  onCancel,
  onImport,
}: GoogleSheetImportDialogProps) {
  const [link, setLink] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) return;
    setLink("");
    setTouched(false);
  }, [open]);

  const trimmed = link.trim();
  const valid = isGoogleSheetLink(link);
  const showError = touched && trimmed.length > 0 && !valid;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !importing) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Import a Google Sheet</DialogTitle>
          <DialogDescription>
            Google Sheet · {sourceName} · {ownershipLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-1.5">
            <p
              className="luxia-type-body-dense"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              Paste a shared Google Sheets link.
            </p>
            <p
              className="luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Make sure the sheet can be accessed from the shared link before
              importing. Each tab becomes a table on this Data Source.
            </p>
          </div>

          <FilterField label="Google Sheet URL" htmlFor="google-sheet-url">
            <Input
              id="google-sheet-url"
              value={link}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              autoComplete="off"
              disabled={importing}
              aria-invalid={showError || undefined}
              aria-describedby={showError ? "google-sheet-url-error" : undefined}
              className="min-w-0 break-all"
              onChange={(event) => setLink(event.target.value)}
              onBlur={() => setTouched(true)}
            />
          </FilterField>

          {showError ? (
            <p
              id="google-sheet-url-error"
              role="alert"
              className="luxia-type-caption"
              style={{ color: "var(--luxia-error)" }}
            >
              That does not look like a Google Sheets link. It should start with
              https://docs.google.com/spreadsheets/d/
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            disabled={importing}
            onClick={onBack}
          >
            Back
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              disabled={importing}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="compact"
              className="min-w-[112px]"
              disabled={!valid || importing}
              aria-busy={importing || undefined}
              onClick={() => onImport(trimmed)}
            >
              {importing ? "Importing…" : "Import"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
