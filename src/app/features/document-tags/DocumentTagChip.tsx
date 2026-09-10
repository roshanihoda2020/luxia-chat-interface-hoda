import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { cn } from "@/app/components/ui/utils";
import { documentTagTone } from "./tagTone";
import type { DocumentTagDefinition } from "./types";

type TagChipTag = Pick<DocumentTagDefinition, "name" | "color"> & { id?: string };

export function tagChipToneStyle(tag: TagChipTag): CSSProperties {
  const tone = documentTagTone(tag.color);
  return {
    color: tone.color,
    ["--tag-chip-bg" as string]: tone.background,
    ["--tag-chip-border" as string]: tone.borderColor,
    ["--tag-chip-border-hover" as string]: tone.color,
    ["--tag-chip-bg-hover" as string]: `color-mix(in srgb, ${tone.swatch} 44%, var(--luxia-neutral-white))`,
  };
}

/** Compact metadata label. Colors come from tagChipToneStyle — do not restyle hues here. */
export const TAG_CHIP_BASE_CLASS =
  "box-border inline-flex h-[22px] max-w-full min-w-0 items-center overflow-hidden rounded-[var(--luxia-radius-8)] border border-[color:var(--tag-chip-border)] bg-[var(--tag-chip-bg)] text-[12px] font-medium leading-4";

export const TAG_CHIP_SHELL_CLASS =
  `${TAG_CHIP_BASE_CLASS} gap-0.5 pl-1.5 pr-0.5`;

export const TAG_CHIP_NAME_BUTTON_CLASS =
  "min-w-0 flex-1 truncate rounded-[2px] py-0 pl-0 pr-0.5 text-left text-[12px] font-medium leading-4 outline-none hover:bg-[color-mix(in_srgb,var(--tag-chip-border)_22%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export const TAG_CHIP_REMOVE_CLASS =
  "inline-flex h-full w-[14px] shrink-0 items-center justify-center rounded-[2px] p-0 text-[12px] leading-none opacity-50 outline-none hover:bg-[color-mix(in_srgb,var(--tag-chip-border)_22%,transparent)] hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]";

export const TAG_CHIP_LIST_CLASS =
  "inline-flex max-w-full min-w-0 flex-wrap items-center gap-1";

/** Single-line cluster for table rows. Same 4px gap; does not wrap. */
export const TAG_CHIP_ROW_CLASS =
  "inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1";

const CHIP_CLASS = `${TAG_CHIP_BASE_CLASS} px-1.5`;

/** Read-only chip (library table, picker, View/Use). No ×, no edit. */
export const DocumentTagChip = forwardRef<
  HTMLButtonElement,
  {
    tag: TagChipTag;
    interactive?: boolean;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function DocumentTagChip({ tag, interactive = false, className, type = "button", ...props }, ref) {
  const classes = cn(
    CHIP_CLASS,
    interactive
      && "cursor-pointer outline-none transition-[border-color,background-color] hover:border-[color:var(--tag-chip-border-hover)] hover:bg-[var(--tag-chip-bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] aria-expanded:border-[color:var(--tag-chip-border-hover)] aria-expanded:bg-[var(--tag-chip-bg-hover)]",
    className,
  );
  const style = tagChipToneStyle(tag);
  const label = <span className="min-w-0 truncate">{tag.name}</span>;

  if (!interactive) {
    return (
      <span className={classes} style={style}>
        {label}
      </span>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} style={style} {...props}>
      {label}
    </button>
  );
});
