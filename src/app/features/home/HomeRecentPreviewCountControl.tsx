import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/app/components/ui/select";
import {
  HOME_RECENT_PREVIEW_COUNT_OPTIONS,
  type HomeRecentPreviewCount,
} from "./homeRecentPreviewCount";

interface HomeRecentPreviewCountControlProps {
  value: HomeRecentPreviewCount;
  onChange: (value: HomeRecentPreviewCount) => void;
}

function parseSelectValue(value: string): HomeRecentPreviewCount | null {
  if (value === "all") return "all";
  if (value === "3") return 3;
  if (value === "6") return 6;
  if (value === "9") return 9;
  return null;
}

function optionLabel(option: HomeRecentPreviewCount): string {
  return option === "all" ? "All" : String(option);
}

/**
 * Compact single control: “Show 6 ▾” / “Show All ▾” for Home Recent density.
 */
export function HomeRecentPreviewCountControl({
  value,
  onChange,
}: HomeRecentPreviewCountControlProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => {
        const parsed = parseSelectValue(next);
        if (parsed != null) onChange(parsed);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Number of recent projects to show"
        className="h-8 min-h-8 w-auto gap-1 px-2.5 luxia-type-caption"
        style={{
          background: "var(--luxia-surface)",
          borderColor: "var(--luxia-border-default)",
          color: "var(--luxia-text-secondary)",
        }}
      >
        <span className="tabular-nums whitespace-nowrap">
          Show {optionLabel(value)}
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[7rem]">
        {HOME_RECENT_PREVIEW_COUNT_OPTIONS.map((option) => {
          const label = optionLabel(option);
          return (
            <SelectItem
              key={String(option)}
              value={String(option)}
              textValue={`${label} projects`}
              aria-label={`${label} projects`}
            >
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
