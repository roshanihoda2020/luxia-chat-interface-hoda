"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { cn } from "./utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  content?: React.ReactNode;
};

const VISIBLE_OPTION_CAP = 200;

const triggerClassName = cn(
  "border-[var(--luxia-border-default)] data-[placeholder]:text-[var(--luxia-text-muted)] [&_svg:not([class*='text-'])]:text-[var(--luxia-text-muted)]",
  "focus-visible:border-[var(--luxia-border-focus)] focus-visible:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-32)]",
  "aria-invalid:border-[var(--luxia-error)] aria-invalid:shadow-[0_0_0_3px_var(--luxia-opacity-error-16)]",
  "flex w-full items-center justify-between gap-2 rounded-[var(--luxia-radius-8)] border bg-[var(--luxia-surface)] px-3.5 py-2",
  "luxia-type-input-value whitespace-nowrap transition-[border-color,box-shadow] outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50 h-10 min-h-10",
  "hover:border-[var(--luxia-border-strong)]",
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
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const listId = React.useId();

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

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function handleSelect(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  const showPlaceholder = !selected;
  const emptyMessage = options.length === 0 ? emptyText : noResultsText;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          disabled={disabled}
          data-placeholder={showPlaceholder ? "" : undefined}
          data-searchable-select-open={open ? "true" : undefined}
          className={cn(triggerClassName, className)}
        >
          <span
            className={cn(
              "line-clamp-1 flex min-w-0 flex-1 items-center gap-2 text-left",
              showPlaceholder && "text-[var(--luxia-text-muted)]",
            )}
          >
            {selected ? (selected.content ?? selected.label) : placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className={cn(
          "p-0 overflow-hidden",
          "bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)]",
          "rounded-[var(--luxia-radius-12)] border shadow-[var(--luxia-shadow-md)]",
          "z-[100] w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)]",
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
