import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { readDataSourceDocuments } from "@/app/features/data-sources/documents";
import { PDF_SAFE_DIALOG_CONTENT_CLASS } from "@/app/features/document-review";
import { FileDataSourceDocumentsPanel } from "@/app/features/document-tags";
import {
  permissionRank,
  resolveUserDataSourceAccess,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";

/**
 * Constellation creation → Add Data, existing File source: choose which of the
 * source's documents the Constellation uses. Reuses the Tag & Extract
 * Documents panel in picker mode (selection by document ID, search, tag and
 * extraction-status filters, Extract / Review / Retry). Extraction, tagging and
 * review editing follow the user's Data Source Manage permission; selecting
 * documents does not need it. Nothing has to be extracted or approved first.
 *
 * Review opens in a full-window workspace over the wizard instead of the new
 * browser tab the spec describes: the wizard draft lives in memory and a new
 * tab could not share it, so the draft, selection and filters stay intact here.
 */
/** The one Data Source document picker, used by Constellation creation and Settings → Add documents. */
export { CreationDocumentPicker as DataSourceDocumentPicker };

export function CreationDocumentPicker({
  source,
  selectedDocumentIds,
  onSelectedDocumentIdsChange,
  accessLevels,
  dataSources,
  currentUserId,
  lockedDocumentIds,
  reviewBackLabel = "Back to document selection",
}: {
  source: DataSourceCatalogItem;
  /** Null means every document is selected. */
  selectedDocumentIds: string[] | null;
  onSelectedDocumentIdsChange: (ids: string[]) => void;
  accessLevels: AccessLevelRecord[];
  dataSources: DataSourceCatalogItem[];
  currentUserId: string;
  /** Documents already in use (e.g. already added to the Constellation); shown fixed. */
  lockedDocumentIds?: readonly string[];
  reviewBackLabel?: string;
}) {
  const documents = useMemo(
    () => readDataSourceDocuments(source.id, source.contentSummary),
    [source.id, source.contentSummary],
  );
  const selected = useMemo(
    () => selectedDocumentIds ?? documents.map((document) => document.localDocumentId),
    [selectedDocumentIds, documents],
  );
  const access = resolveUserDataSourceAccess(currentUserId, source.id, accessLevels, dataSources);
  const canManageSource = Boolean(
    access.permission && permissionRank(access.permission) >= permissionRank("Manage"),
  );
  const [reviewHost, setReviewHost] = useState<HTMLDivElement | null>(null);
  const [reviewing, setReviewing] = useState(false);

  if (documents.length === 0) {
    return (
      <p className="luxia-type-body-dense text-[var(--luxia-text-secondary)]">
        This Data Source has no documents yet.
      </p>
    );
  }

  return (
    <>
      <FileDataSourceDocumentsPanel
        dataSourceId={source.id}
        dataSourceName={source.name}
        documents={documents}
        canEdit={canManageSource}
        currentUserId={currentUserId}
        selectedDocumentIds={selected}
        onSelectedDocumentIdsChange={onSelectedDocumentIdsChange}
        lockedDocumentIds={lockedDocumentIds}
        reviewPortalHost={reviewHost}
        onReviewActiveChange={setReviewing}
        reviewBackLabel={reviewBackLabel}
      />
      {/* Focused Review over the wizard; the workspace's own Back closes it. */}
      <Dialog open={reviewing}>
        <DialogContent
          className={`flex h-[min(94vh,64rem)] w-[min(97vw,104rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none ${PDF_SAFE_DIALOG_CONTENT_CLASS}`}
          hideCloseButton
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogTitle className="sr-only">Review document</DialogTitle>
          <DialogDescription className="sr-only">
            Review a document of {source.name} without leaving Constellation creation.
          </DialogDescription>
          <div ref={setReviewHost} className="flex min-h-0 flex-1 flex-col" />
        </DialogContent>
      </Dialog>
    </>
  );
}
