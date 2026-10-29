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
import {
  createLocalDocumentId,
  createSampleFixtureDocumentId,
  isSampleFixtureDocumentId,
} from "@/app/features/data-sources/documents";
import { REVIEW_SAMPLE_FILE_BYTES, REVIEW_SAMPLE_FILE_NAME } from "@/app/features/document-review";
import type { DraftDataSourceTagsApi } from "@/app/features/document-tags";
import { DataSourceCreationSection, DataSourceDetailsSection, DataSourceDetailsSummary } from "./DataSourceDetailsSection";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".md", ".txt"];
const ACCEPT_ATTR = ".pdf,.docx,.pptx,.md,.txt,application/pdf,text/plain,text/markdown";

type UploadFileStatus = "Ready" | "Processing" | "Failed";

/** One file in the upload draft. `localDocumentId` stays the document's identity after creation. */
export interface UploadDraftFile {
  localDocumentId: string;
  name: string;
  status: UploadFileStatus;
  sizeBytes: number;
  uploadedAt: string;
}

export interface FileUploadDialogProps {
  open: boolean;
  sourceName: string;
  ownershipLabel: string;
  /** Upload draft, owned by the creation flow so later steps share it. */
  files: UploadDraftFile[];
  onFilesChange: (files: UploadDraftFile[]) => void;
  onBack: () => void;
  onCancel: () => void;
  /** Move on to Extract, review and tag. */
  onContinue: (files: UploadDraftFile[]) => void;
  tagDraft: DraftDataSourceTagsApi;
}

function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function FileUploadDialog({
  open,
  sourceName,
  ownershipLabel,
  files,
  onFilesChange,
  onBack,
  onCancel,
  onContinue,
  tagDraft,
}: FileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const setFiles = (next: UploadDraftFile[] | ((prev: UploadDraftFile[]) => UploadDraftFile[])) => {
    onFilesChange(typeof next === "function" ? next(filesRef.current) : next);
  };
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
    const uploadedAt = new Date().toISOString();
    const added = accepted.map((file) => ({
      localDocumentId: createLocalDocumentId(),
      name: file.name,
      status: "Ready" as const,
      sizeBytes: file.size,
      uploadedAt,
    }));
    setFiles((prev) => [...prev, ...added]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  }

  /** PROTOTYPE: adds the labelled sample document, the only upload with sample review content. */
  function addSampleDocument() {
    if (files.some((file) => isSampleFixtureDocumentId(file.localDocumentId))) return;
    setFiles((prev) => [
      ...prev,
      {
        localDocumentId: createSampleFixtureDocumentId(),
        name: REVIEW_SAMPLE_FILE_NAME,
        status: "Ready" as const,
        sizeBytes: REVIEW_SAMPLE_FILE_BYTES,
        uploadedAt: new Date().toISOString(),
      },
    ]);
  }

  function handleContinue() {
    if (files.length === 0 || creating) return;
    setCreating(true);
    setFiles((prev) => prev.map((file) => ({ ...file, status: "Processing" as const })));
    window.setTimeout(() => {
      const next = filesRef.current.map((file) => ({ ...file, status: "Ready" as const }));
      setFiles(next);
      setCreating(false);
      onContinue(next);
    }, 450);
  }

  const canCreate = files.length > 0 && !creating && files.every((file) => file.status !== "Failed");
  const hasSample = files.some((file) => isSampleFixtureDocumentId(file.localDocumentId));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            File · {sourceName} · {ownershipLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <DataSourceDetailsSection tagDraft={tagDraft}>
            <DataSourceDetailsSummary name={sourceName} ownershipLabel={ownershipLabel} />
          </DataSourceDetailsSection>

          <DataSourceCreationSection title="Files">
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

          {!hasSample ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
                Prototype: add a sample PDF with sample extracted content to try Review.
              </p>
              <Button type="button" variant="secondary" size="compact" disabled={creating} onClick={addSampleDocument}>
                Add sample document
              </Button>
            </div>
          ) : null}

          {error ? (
            <p className="luxia-type-caption text-[var(--luxia-status-danger,var(--luxia-text-danger,#b42318))]" role="alert">
              {error}
            </p>
          ) : null}

          {files.length > 0 ? (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.localDocumentId}
                  className="flex items-start justify-between gap-3 rounded-[var(--luxia-radius-control)] border px-3 py-2"
                  style={{ borderColor: "var(--luxia-border-subtle)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate luxia-type-body-dense text-[var(--luxia-text-primary)]">
                      {file.name}
                    </p>
                    <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                      {file.status}
                      {isSampleFixtureDocumentId(file.localDocumentId) ? " · Sample document" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    aria-label={`Remove ${file.name}`}
                    disabled={creating}
                    onClick={() => {
                      setFiles(files.filter((item) => item.localDocumentId !== file.localDocumentId));
                    }}
                  >
                    <X size={16} aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          </DataSourceCreationSection>
        </div>

        <DialogFooter className="shrink-0 justify-between">
          <Button type="button" variant="secondary" size="compact" disabled={creating} onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!canCreate}
            onClick={handleContinue}
          >
            {creating ? "Uploading…" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
