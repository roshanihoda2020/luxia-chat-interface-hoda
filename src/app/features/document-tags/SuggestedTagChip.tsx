import { Check, X } from "lucide-react";
import { LuxiaAiIcon } from "@/assets/icons";
import { TAG_CHIP_BASE_CLASS, TAG_CHIP_REMOVE_CLASS } from "./DocumentTagChip";
import type { TagSuggestionItem } from "./tagSuggestionStore";

/**
 * A pending AI tag suggestion. Dashed and neutral so it never reads as an
 * applied tag; "New" marks a tag this Data Source's documents do not use yet.
 * Accept applies it as a normal document tag; Reject dismisses it.
 */
export function SuggestedTagChip({
  item,
  documentName,
  outdated = false,
  onAccept,
  onReject,
}: {
  item: TagSuggestionItem;
  documentName: string;
  outdated?: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const detail = [
    "Prototype AI suggestion, not applied",
    item.isNewToVocabulary ? "new to this Data Source" : "already used in this Data Source",
    item.evidence.length > 0 ? `matched: ${item.evidence.join(", ")}` : null,
    outdated ? "content changed since this suggestion" : null,
  ].filter(Boolean).join(" · ");

  return (
    <span
      className={`${TAG_CHIP_BASE_CLASS} gap-1 border-dashed pl-1.5 pr-0.5`}
      style={{
        ["--tag-chip-border" as string]: "var(--luxia-border-strong, var(--luxia-border-default))",
        ["--tag-chip-bg" as string]: "var(--luxia-surface)",
        color: "var(--luxia-text-secondary)",
        opacity: outdated ? 0.7 : 1,
      }}
      title={detail}
      data-suggestion-id={item.id}
    >
      <LuxiaAiIcon size={11} aria-hidden />
      <span className="min-w-0 truncate">{item.label}</span>
      {item.isNewToVocabulary ? (
        <span className="shrink-0 text-[11px] font-semibold leading-none" style={{ color: "var(--luxia-text-primary)" }}>New</span>
      ) : null}
      <span className="sr-only">{`, ${detail}`}</span>
      {/* Accept and Reject are separate, full-height targets, divided from the label. */}
      <span aria-hidden className="mx-0.5 h-3 w-px shrink-0" style={{ background: "var(--luxia-border-default)" }} />
      <button
        type="button"
        className={`${TAG_CHIP_REMOVE_CLASS} w-[18px]`}
        style={{ opacity: 1, color: "var(--luxia-success)" }}
        aria-label={`Accept suggested tag ${item.label} for ${documentName}`}
        title="Accept"
        onClick={onAccept}
      >
        <Check size={12} strokeWidth={2.5} aria-hidden />
      </button>
      <button
        type="button"
        className={`${TAG_CHIP_REMOVE_CLASS} w-[18px]`}
        style={{ opacity: 0.8 }}
        aria-label={`Reject suggested tag ${item.label} for ${documentName}`}
        title="Reject"
        onClick={onReject}
      >
        <X size={12} aria-hidden />
      </button>
    </span>
  );
}
