import { DOCUMENT_TAG_COLOR_IDS, DOCUMENT_TAG_COLOR_LABELS, DOCUMENT_TAG_PALETTE } from "./tagTone";
import type { DocumentTagColorId } from "./types";

export function TagColorSwatches({
  value,
  onChange,
  name,
}: {
  value: DocumentTagColorId;
  onChange: (color: DocumentTagColorId) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label="Tag color" className="flex flex-wrap items-center gap-1.5">
      {DOCUMENT_TAG_COLOR_IDS.map((colorId) => {
        const selected = value === colorId;
        const tone = DOCUMENT_TAG_PALETTE[colorId];
        return (
          <button
            key={colorId}
            type="button"
            role="radio"
            name={name}
            aria-checked={selected}
            aria-label={DOCUMENT_TAG_COLOR_LABELS[colorId]}
            title={DOCUMENT_TAG_COLOR_LABELS[colorId]}
            onClick={() => onChange(colorId)}
            className="size-6 shrink-0 rounded-full border outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-2"
            style={{
              background: tone.swatch,
              borderColor: selected ? tone.color : tone.borderColor,
              boxShadow: selected ? `0 0 0 2px var(--luxia-neutral-white), 0 0 0 4px ${tone.color}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
