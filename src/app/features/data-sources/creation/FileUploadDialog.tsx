import { useRef, useState, type DragEvent } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".md", ".txt"];
const ACCEPT_ATTR = ".pdf,.docx,.pptx,.md,.txt,application/pdf,text/plain,text/markdown";

export interface FileUploadDialogProps {
  open: boolean;
  sourceName: string;
  ownershipLabel: string;
  onBack: () => void;
  onCancel: () => void;
  onCreate: (files: Array<{ name: string; status: "Ready" | "Processing" | "Failed" }>) => void;
}

function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function FileUploadDialog({
  open,
  sourceName,
  ownershipLabel,
  onBack,
  onCancel,
  onCreate,
}: FileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Array<{ id: string; name: string; status: "Ready" | "Processing" | "Failed" }>>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function addFiles(list: FileList | File[] | null | undefined) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const rejected = incoming.filter((file) => !isAcceptedFile(file.name));
    const accepted = incoming.filter((file) => isAcceptedFile(file.name));
    if (rejected.length > 0) {
      setError(
        `Unsupported: ${rejected.map((file) => file.name).join(", ")}. Supported formats: PDF, DOCX, PPTX, MD, TXT.`,
      );
    } else {
      setError(null);
    }
    if (accepted.length === 0) return;
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        name: file.name,
        status: "Ready" as const,
      })),
    ]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  }

  function handleCreate() {
    if (files.length === 0 || creating) return;
    setCreating(true);
    setFiles((prev) => prev.map((file) => ({ ...file, status: "Processing" as const })));
    window.setTimeout(() => {
      const next = files.map((file) => ({ ...file, status: "Ready" as const }));
      setFiles(next);
      setCreating(false);
      onCreate(next.map(({ name, status }) => ({ name, status })));
    }, 450);
  }

  const canCreate = files.length > 0 && !creating && files.every((file) => file.status !== "Failed");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left" style={{ borderColor: "var(--luxia-border-subtle)" }}>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            File · {sourceName} · {ownershipLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
            Ownership stays {ownershipLabel.toLowerCase()}. Access Levels control sharing.
            Organization Admins do not automatically Manage another user's private source.
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-label="Drop files here or browse"
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className="rounded-[var(--luxia-radius-control)] border border-dashed px-4 py-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{
              borderColor: dragActive
                ? "var(--luxia-border-focus)"
                : "var(--luxia-border-subtle)",
              background: "var(--luxia-surface-muted)",
            }}
          >
            <FileText
              className="mx-auto mb-3"
              size={26}
              strokeWidth={1.5}
              aria-hidden
              style={{ color: "var(--luxia-text-secondary)" }}
            />
            <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
              Drag and drop files here
            </p>
            <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
              PDF, DOCX, PPTX, MD, TXT · multiple files supported
            </p>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {error ? (
            <p className="luxia-type-caption text-[var(--luxia-status-danger,var(--luxia-text-danger,#b42318))]" role="alert">
              {error}
            </p>
          ) : null}

          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--luxia-radius-control)] border px-3 py-2"
                  style={{ borderColor: "var(--luxia-border-subtle)" }}
                >
                  <div className="min-w-0">
                    <p className="truncate luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {file.name}
                    </p>
                    <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      {file.status}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    aria-label={`Remove ${file.name}`}
                    disabled={creating}
                    onClick={() =>
                      setFiles((prev) => prev.filter((item) => item.id !== file.id))
                    }
                  >
                    <X size={16} aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <DialogFooter
          className="shrink-0 justify-between border-t px-6 py-4"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <Button type="button" variant="secondary" size="compact" disabled={creating} onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            {creating ? "Uploading…" : "Create Data Source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
