import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";

export type PageSizeSelectProps = {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  /** Accessible name. Default: "Rows per page" */
  ariaLabel?: string;
  className?: string;
  /** Applied to the select content portal (e.g. settings z-index). */
  contentClassName?: string;
  disabled?: boolean;
};

/**
 * Compact rows-per-page control. Parent owns page reset and list slicing.
 */
export function PageSizeSelect({
  value,
  options,
  onChange,
  ariaLabel = "Rows per page",
  className,
  contentClassName,
  disabled = false,
}: PageSizeSelectProps) {
  return (
    <Select
      value={String(value)}
      disabled={disabled}
      onValueChange={(next) => {
        const parsed = Number(next);
        if (!Number.isFinite(parsed)) return;
        onChange(parsed);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn("h-8 min-h-8 w-[5.5rem]", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
