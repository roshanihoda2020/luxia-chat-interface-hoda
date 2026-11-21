import { useMemo } from "react";
import { FileText, ListChecks } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { listVerifaiLibraryFiles, useVerifaiLibraryVersion, type VerifaiLibraryFile } from "../libraryStore";
import { useReturnFocus } from "./useReturnFocus";

function fileMeta(file: VerifaiLibraryFile) {
  if (file.role === "checklist") {
    return `${file.requirementCount} requirements · ${file.sectionCount} section${file.sectionCount === 1 ? "" : "s"}`;
  }
  const doc = file.document;
  return `PDF · ${doc.pages} page${doc.pages === 1 ? "" : "s"} · ${doc.sizeLabel}`;
}

function FileRow({ file, visibleReviewIds }: { file: VerifaiLibraryFile; visibleReviewIds: ReadonlySet<string> }) {
  const Icon = file.role === "checklist" ? ListChecks : FileText;
  // Only reviews this viewer may open: another user's private review never shows up in a count.
  const used = file.reviewIds.filter((id) => visibleReviewIds.has(id)).length;
  return (
    <li
      className="flex min-w-0 items-start gap-3 rounded-[10px] border px-3 py-2.5"
      style={{ borderColor: "var(--luxia-border-subtle)", background: "var(--luxia-surface, #fff)" }}
      data-vfy-library-file={file.id}
      data-visibility={file.visibility}
    >
      <Icon size={16} aria-hidden className="mt-0.5 shrink-0" style={{ color: "var(--luxia-purple-60)" }} />
      <div className="min-w-0 flex-1">
        <p className="truncate luxia-type-body-dense font-medium" title={file.name} style={{ color: "var(--luxia-text-primary)" }}>{file.name}</p>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{fileMeta(file)}</p>
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {file.uploadedLabel}{used ? ` · Used in ${used} review${used === 1 ? "" : "s"}` : ""}
        </p>
      </div>
      <Badge
        variant="outline"
        className="min-h-0 h-auto shrink-0 px-1.5 py-0 luxia-type-caption font-normal"
        style={{ color: "var(--luxia-text-secondary)", borderColor: "var(--luxia-border-subtle)" }}
      >
        {file.visibility === "shared" ? "Shared" : "Only you"}
      </Badge>
    </li>
  );
}

/**
 * Read-only view of the Constellation's VerifAI review library (Phase 2): the shared files plus
 * the viewer's own review uploads. Managing the shared library comes in a later phase.
 */
export function ReviewLibrarySheet({
  open,
  onOpenChange,
  constellationId,
  constellationLabel,
  userId,
  visibleReviewIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constellationId: string;
  constellationLabel: string;
  userId: string;
  /** Reviews the viewer may see (already filtered by `canViewVerifaiReview`). */
  visibleReviewIds: ReadonlySet<string>;
}) {
  const version = useVerifaiLibraryVersion();
  const returnFocus = useReturnFocus(open);
  const files = useMemo(
    () => (constellationId ? listVerifaiLibraryFiles(constellationId, userId) : []),
    // version re-reads the library after uploads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [constellationId, userId, version],
  );
  const groups: Array<{ title: string; items: VerifaiLibraryFile[] }> = [
    { title: "Checklists", items: files.filter((f) => f.role === "checklist") },
    { title: "Target documents", items: files.filter((f) => f.role === "target") },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[24rem]" onCloseAutoFocus={returnFocus} data-vfy-library-sheet="">
        <SheetHeader className="border-b px-5 py-4" style={{ borderColor: "var(--luxia-border-subtle)" }}>
          <SheetTitle>Review library</SheetTitle>
          <SheetDescription>
            Files for VerifAI reviews in {constellationLabel}. Separate from Data Sources.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {groups.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h3 className="mb-2 luxia-type-label-small uppercase tracking-wide" style={{ color: "var(--luxia-text-secondary)" }}>
                {group.title} <span style={{ color: "var(--luxia-text-muted)" }}>· {group.items.length}</span>
              </h3>
              {group.items.length ? (
                <ul className="flex flex-col gap-2">{group.items.map((file) => <FileRow key={file.id} file={file} visibleReviewIds={visibleReviewIds} />)}</ul>
              ) : (
                <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>None yet.</p>
              )}
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
