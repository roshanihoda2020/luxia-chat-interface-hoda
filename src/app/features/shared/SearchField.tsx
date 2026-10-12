import { Search, X } from "lucide-react";
import { useRef, type CSSProperties } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/components/ui/utils";
import { HS } from "@/app/features/home/homeSurfaces";

export type SearchFieldDensity = "dense" | "page";

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Required accessible name for the search input. */
  "aria-label": string;
  density?: SearchFieldDensity;
  /**
   * When true (default for dense), show a clear control while the value is non-empty.
   * Page density defaults to false.
   */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  inputClassName?: string;
  /** Dense shell style merge (e.g. preserve a local surface background). */
  style?: CSSProperties;
};

/**
 * Shared Luxia search field.
 * Dense = capability-manager toolbar shell. Page = browser/filter toolbar bar.
 * Controlled only — no debounce or filtering inside this component.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  density = "dense",
  clearable,
  disabled = false,
  id,
  className,
  inputClassName,
  style,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const allowClear = clearable ?? density === "dense";
  const showClear = allowClear && value.length > 0 && !disabled;

  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  if (density === "page") {
    return (
      <div className={cn("relative", className)} style={style}>
        <Search
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--luxia-text-muted)]"
        />
        <Input
          ref={inputRef}
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn("h-10 w-full pl-9", showClear && "pr-10", inputClassName)}
          style={{
            background: HS.searchBg,
            borderColor: HS.searchBorder,
          }}
        />
        {showClear ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2"
            aria-label="Clear search"
            disabled={disabled}
            onClick={handleClear}
          >
            <X size={12} className="text-[var(--luxia-text-muted)]" aria-hidden />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border px-3 py-2",
        "border-[var(--luxia-border-default)] transition-[border-color] duration-160",
        "focus-within:border-[var(--luxia-border-strong)]",
        disabled && "opacity-50",
        className,
      )}
      style={{
        background: "var(--luxia-surface-subtle, #F8FAFC)",
        ...style,
      }}
    >
      <Search
        size={14}
        aria-hidden
        className="shrink-0 text-[var(--luxia-text-muted)]"
      />
      <Input
        ref={inputRef}
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "h-8 min-h-0 py-0 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0 focus-visible:border-transparent",
          inputClassName,
        )}
      />
      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Clear search"
          disabled={disabled}
          onClick={handleClear}
        >
          <X size={12} className="text-[var(--luxia-text-muted)]" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
