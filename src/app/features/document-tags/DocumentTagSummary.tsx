import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { DocumentTagChip, TAG_CHIP_LIST_CLASS, TAG_CHIP_ROW_CLASS } from "./DocumentTagChip";
import { tagsForTableInSources, effectiveTagsForDataSource } from "./persistence";
import { tagsForFileTarget } from "./fileTagFilter";
import { documentTagTone } from "./tagTone";
import type { DocumentTagDefinition } from "./types";
import { useDataSourceTagStore } from "./useDataSourceTags";

const VISIBLE_TAG_LIMIT = 2;
const HIDDEN_DOT_LIMIT = 3;
const HOVER_CLOSE_MS = 180;

function TagToneDot({ tag }: { tag: DocumentTagDefinition }) {
  const tone = documentTagTone(tag.color);
  return (
    <span
      className="size-1 shrink-0 rounded-full opacity-80"
      style={{ background: tone.swatch }}
      aria-hidden
    />
  );
}

function OverflowTagsTrigger({
  hiddenTags,
  overflow,
  overflowTitle,
  onTagClick,
}: {
  hiddenTags: readonly DocumentTagDefinition[];
  overflow: number;
  overflowTitle: string;
  onTagClick?: (tag: DocumentTagDefinition) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  function cancelClose() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const dots = hiddenTags.slice(0, HIDDEN_DOT_LIMIT);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-[22px] shrink-0 items-center gap-0.5 rounded-[var(--luxia-radius-8)] px-1 outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-text-secondary)" }}
          aria-label={`${overflow.toLocaleString()} more tags. Show remaining ${overflowTitle.toLowerCase()}.`}
          onPointerEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onPointerLeave={scheduleClose}
          onClick={(event) => event.stopPropagation()}
        >
          {dots.map((tag) => (
            <TagToneDot key={tag.id} tag={tag} />
          ))}
          <span className="whitespace-nowrap text-[12px] font-medium leading-4">
            +{overflow.toLocaleString()}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 p-3 bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)] rounded-[var(--luxia-radius-12)] shadow-[var(--luxia-shadow-md)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="luxia-type-label-small" style={{ color: "var(--luxia-text-secondary)" }}>
          {overflowTitle}
        </p>
        <div className={`mt-2 max-h-48 overflow-y-auto ${TAG_CHIP_LIST_CLASS}`}>
          {hiddenTags.map((tag) => (
            <DocumentTagChip
              key={tag.id}
              tag={tag}
              interactive={Boolean(onTagClick)}
              aria-label={onTagClick ? `Filter by ${tag.name}` : undefined}
              onClick={
                onTagClick
                  ? (event) => {
                      event.stopPropagation();
                      onTagClick(tag);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DocumentTagSummary({
  tags,
  maxVisible = VISIBLE_TAG_LIMIT,
  emptyLabel = null,
  overflowTitle = "More tags",
  onTagClick,
}: {
  tags: readonly DocumentTagDefinition[];
  maxVisible?: number;
  emptyLabel?: string | null;
  overflowTitle?: string;
  /** When set, chips apply this tag as a list filter (no navigation). */
  onTagClick?: (tag: DocumentTagDefinition) => void;
}) {
  if (tags.length === 0) {
    if (!emptyLabel) return null;
    return (
      <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        {emptyLabel}
      </span>
    );
  }

  const visible = tags.slice(0, maxVisible);
  const hidden = tags.slice(maxVisible);
  const overflow = hidden.length;

  return (
    <span className={TAG_CHIP_ROW_CLASS}>
      {visible.map((tag) => (
        <span key={tag.id} className="inline-flex min-w-0 max-w-[4.75rem]">
          <DocumentTagChip
            tag={tag}
            interactive={Boolean(onTagClick)}
            aria-label={onTagClick ? `Filter by ${tag.name}` : undefined}
            onClick={
              onTagClick
                ? (event) => {
                    event.stopPropagation();
                    onTagClick(tag);
                  }
                : undefined
            }
          />
        </span>
      ))}
      {overflow > 0 ? (
        <OverflowTagsTrigger
          hiddenTags={hidden}
          overflow={overflow}
          overflowTitle={overflowTitle}
          onTagClick={onTagClick}
        />
      ) : null}
    </span>
  );
}

/** Compact Data Source tags for the library table and discovery rows. */
export function DataSourceLibraryDocumentTags({
  dataSourceId,
  emptyLabel = null,
  className,
  onTagClick,
}: {
  dataSourceId: string;
  emptyLabel?: string | null;
  className?: string;
  onTagClick?: (tag: DocumentTagDefinition) => void;
}) {
  const store = useDataSourceTagStore();
  void store;
  const tags = effectiveTagsForDataSource(dataSourceId);
  if (tags.length === 0 && !emptyLabel) return null;
  const summary = (
    <DocumentTagSummary tags={tags} emptyLabel={emptyLabel} onTagClick={onTagClick} />
  );
  if (!className) return summary;
  return <span className={className}>{summary}</span>;
}

/** Compact File tags for constellation file lists. Independent of Data Source tags. */
export function FileLibraryDocumentTags({
  fileName,
  sourceIds,
  document,
  className,
  onTagClick,
}: {
  fileName: string;
  sourceIds: readonly string[];
  /** Exact document reference; when set, tags come from that document only. */
  document?: { dataSourceId: string; localDocumentId: string };
  className?: string;
  onTagClick?: (tag: DocumentTagDefinition) => void;
}) {
  const store = useDataSourceTagStore();
  void store;
  const tags = tagsForFileTarget({ fileName, sourceIds, document });
  if (tags.length === 0) return null;
  const summary = (
    <DocumentTagSummary
      tags={tags}
      overflowTitle="Tags on this file"
      onTagClick={onTagClick}
    />
  );
  if (!className) return summary;
  return <span className={className}>{summary}</span>;
}

/** Compact imported-table tags for constellation CSV file lists. Read-only. */
export function TableLibraryDocumentTags({
  tableId,
  sourceIds,
  className,
}: {
  tableId: string;
  sourceIds: readonly string[];
  className?: string;
}) {
  const store = useDataSourceTagStore();
  void store;
  const tags = tagsForTableInSources(tableId, sourceIds);
  if (tags.length === 0) return null;
  const summary = (
    <DocumentTagSummary tags={tags} overflowTitle="Tags on this table" />
  );
  if (!className) return summary;
  return <span className={className}>{summary}</span>;
}
