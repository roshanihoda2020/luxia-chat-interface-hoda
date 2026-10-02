"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "./utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  content?: React.ReactNode;
};

const VISIBLE_OPTION_CAP = 200;

const fieldClassName = cn(
  "border-[var(--luxia-border-default)] [&_svg:not([class*='text-'])]:text-[var(--luxia-text-muted)]",
  "flex h-10 min-h-10 w-full items-center gap-0.5 rounded-[var(--luxia-radius-8)] border bg-[var(--luxia-surface)] pr-1.5 pl-3.5",
  "luxia-type-input-value transition-[border-color,box-shadow]",
  "hover:border-[var(--luxia-border-strong)]",
  "focus-within:border-[var(--luxia-border-focus)] focus-within:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-32)]",
  "has-[[aria-invalid=true]]:border-[var(--luxia-error)] has-[[aria-invalid=true]]:shadow-[0_0_0_3px_var(--luxia-opacity-error-16)]",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
);

export function SearchableSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText = "No results found",
  noResultsText = "No results found",
  disabled = false,
  className,
  /** When set, shows a clear control while value differs from clearValue (optional fields). */
  clearValue,
  clearAriaLabel = "Clear selection",
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  noResultsText?: string;
  disabled?: boolean;
  className?: string;
  clearValue?: string;
  clearAriaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const selected = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const visible = filtered.length > VISIBLE_OPTION_CAP
    ? filtered.slice(0, VISIBLE_OPTION_CAP)
    : filtered;
  const capped = visible.length < filtered.length;

  const canClear =
    clearValue !== undefined
    && !disabled
    && value !== clearValue;

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function handleSelect(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  function handleClear(event: React.SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (clearValue === undefined || disabled) return;
    onValueChange(clearValue);
    setOpen(false);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  function handleOpenChange(next: boolean) {
    if (disabled) return;
    setOpen(next);
  }

  const showPlaceholder = !selected;
  const emptyMessage = options.length === 0 ? emptyText : noResultsText;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div
          data-slot="searchable-select-field"
          data-placeholder={showPlaceholder ? "" : undefined}
          data-searchable-select-open={open ? "true" : undefined}
          className={cn(fieldClassName, className)}
        >
          <button
            ref={triggerRef}
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-haspopup="listbox"
            disabled={disabled}
            data-placeholder={showPlaceholder ? "" : undefined}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 bg-transparent py-2 text-left outline-none",
              "disabled:cursor-not-allowed",
              showPlaceholder && "text-[var(--luxia-text-muted)]",
            )}
            onClick={() => {
              if (disabled) return;
              setOpen((prev) => !prev);
            }}
            onKeyDown={(event) => {
              if (disabled) return;
              if (
                canClear
                && !open
                && (event.key === "Backspace" || event.key === "Delete")
              ) {
                event.preventDefault();
                onValueChange(clearValue!);
                return;
              }
              if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(true);
              }
            }}
          >
            <span className="line-clamp-1 min-w-0 flex-1">
              {selected ? (selected.content ?? selected.label) : placeholder}
            </span>
          </button>

          {canClear ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)]",
                    "text-[var(--luxia-text-muted)] outline-none",
                    "hover:bg-[var(--luxia-opacity-brand-primary-08)] hover:text-[var(--luxia-text-secondary)]",
                    "focus-visible:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-24)]",
                  )}
                  aria-label={clearAriaLabel}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={handleClear}
                >
                  <XIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                {clearAriaLabel}
              </TooltipContent>
            </Tooltip>
          ) : null}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={open ? "Close options" : "Open options"}
            aria-expanded={open}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)]",
              "text-[var(--luxia-text-muted)] outline-none",
              "hover:bg-[var(--luxia-opacity-brand-primary-08)]",
              "disabled:cursor-not-allowed",
            )}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => {
              if (disabled) return;
              setOpen((prev) => !prev);
              window.requestAnimationFrame(() => {
                triggerRef.current?.focus();
              });
            }}
          >
            <ChevronDownIcon
              className={cn("size-4 opacity-50 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={12}
        className={cn(
          "p-0 overflow-hidden",
          "bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)]",
          "rounded-[var(--luxia-radius-12)] border shadow-[var(--luxia-shadow-md)]",
          "z-[100] w-[var(--radix-popover-anchor-width)] min-w-[var(--radix-popover-anchor-width)] max-w-[var(--radix-popover-anchor-width)]",
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const root = event.currentTarget as HTMLElement;
          window.requestAnimationFrame(() => {
            root.querySelector<HTMLInputElement>("[data-slot=command-input]")?.focus();
          });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
          }
        }}
      >
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder ?? placeholder}
            aria-label={searchPlaceholder ?? placeholder}
          />
          <CommandList id={listId} role="listbox" className="max-h-[240px]">
            <CommandEmpty className="py-4 text-center luxia-type-metadata text-[var(--luxia-text-muted)]">
              {emptyMessage}
            </CommandEmpty>
            {visible.length > 0 ? (
              <CommandGroup className="p-1">
                {visible.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onSelect={() => handleSelect(option.value)}
                      className={cn(
                        "relative flex w-full cursor-default items-center gap-2 rounded-[var(--luxia-radius-8)] py-2 pr-8 pl-3",
                        "luxia-type-body-dense outline-hidden select-none",
                        "data-[selected=true]:bg-[var(--luxia-opacity-brand-secondary-08)] data-[selected=true]:text-[var(--luxia-brand-primary)]",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.content ?? option.label}
                      </span>
                      {isSelected ? (
                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                          <CheckIcon className="size-4" />
                        </span>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
          {capped ? (
            <p
              className="border-t px-3 py-2 luxia-type-caption"
              style={{
                borderColor: "var(--luxia-border-default)",
                color: "var(--luxia-text-muted)",
              }}
            >
              Showing {visible.length} of {filtered.length} — type to refine
            </p>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
