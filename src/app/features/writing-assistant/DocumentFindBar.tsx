import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

type DocumentFindBarProps = {
  query: string;
  total: number;
  currentIndex: number;
  focusToken?: number;
  onQueryChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
};

export function DocumentFindBar({
  query,
  total,
  currentIndex,
  focusToken = 0,
  onQueryChange,
  onNext,
  onPrevious,
  onClose,
}: DocumentFindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const countLabel =
    total === 0
      ? query.trim()
        ? "No matches"
        : "0 matches"
      : `${currentIndex + 1} of ${total}`;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusToken]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) onPrevious();
      else onNext();
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 border-b px-3 py-1.5"
      style={{
        borderColor: "var(--luxia-border-subtle)",
        background: "var(--luxia-neutral-surface-subtle, #F7F6FA)",
      }}
      role="search"
      aria-label="Find in document"
    >
      <Search
        size={15}
        strokeWidth={1.75}
        className="shrink-0 text-[var(--luxia-text-muted)]"
        aria-hidden
      />
      <Input
        ref={inputRef}
        id={labelId}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in document"
        aria-label="Find in document"
        className="h-7 min-h-7 max-w-[14rem] flex-1 bg-white"
      />
      <span
        className="luxia-type-caption min-w-[4.25rem] tabular-nums"
        style={{ color: "var(--luxia-text-secondary)" }}
        aria-live="polite"
      >
        {countLabel}
      </span>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              aria-label="Previous match"
              disabled={total === 0}
              onClick={onPrevious}
            >
              <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Previous match (Shift+Enter)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              aria-label="Next match"
              disabled={total === 0}
              onClick={onNext}
            >
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Next match (Enter)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              aria-label="Close find"
              onClick={onClose}
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close (Esc)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
