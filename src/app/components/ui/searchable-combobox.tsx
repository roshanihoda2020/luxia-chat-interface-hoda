"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "./command";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { cn } from "./utils";

export type SearchableComboboxOption = {
  value: string;
  label: string;
};

export function filterComboboxOptions(
  options: SearchableComboboxOption[],
  query: string,
): SearchableComboboxOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q),
  );
}

export function SearchableCombobox({
  id,
  label,
  value,
  onValueChange,
  options,
  clearValue,
  emptyText,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableComboboxOption[];
  clearValue: string;
  emptyText: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [menuWidth, setMenuWidth] = React.useState<number>();
  const listId = React.useId();

  React.useLayoutEffect(() => {
    if (!open) return;
    const width = fieldRef.current?.getBoundingClientRect().width;
    if (width) setMenuWidth(width);
  }, [open]);

  const selected = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const selectedLabel = selected?.label ?? "";
  const filterQuery = open && dirty ? draft : "";
  const filtered = React.useMemo(
    () => filterComboboxOptions(options, filterQuery),
    [options, filterQuery],
  );
  const displayValue = open && dirty ? draft : selectedLabel;
  const canClear = value !== clearValue || (open && dirty && draft.length > 0);

  React.useEffect(() => {
    if (!open) {
      setDraft("");
      setDirty(false);
    }
  }, [open]);

  function close() {
    setOpen(false);
    setDraft("");
    setDirty(false);
  }

  function handleSelect(next: string) {
    onValueChange(next);
    close();
  }

  function handleClear(event: React.SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
    onValueChange(clearValue);
    setDraft("");
    setDirty(false);
    inputRef.current?.focus();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setDraft("");
      setDirty(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <Command shouldFilter={false} className="h-auto min-w-0 w-full overflow-visible bg-transparent">
        <PopoverAnchor asChild>
          <div ref={fieldRef} className={cn("relative min-w-0", className)}>
            <label
              htmlFor={id}
              className="pointer-events-none absolute -top-2 left-2.5 z-[1] px-1 luxia-type-caption"
              style={{
                color: "var(--luxia-text-secondary)",
                background: "var(--luxia-settings-section-bg)",
              }}
            >
              {label}
            </label>
            <div
              data-slot="combobox-field"
              className={cn(
                "flex h-10 min-h-10 w-full items-center gap-1 rounded-[var(--luxia-radius-8)] border bg-[var(--luxia-surface)] pr-1.5 pl-3",
                "border-[var(--luxia-border-default)] transition-[border-color,box-shadow]",
                "hover:border-[var(--luxia-border-strong)]",
                "focus-within:border-[var(--luxia-border-focus)] focus-within:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-24)]",
              )}
            >
              <CommandPrimitive.Input
                ref={inputRef}
                id={id}
                value={displayValue}
                onValueChange={(next) => {
                  setDirty(true);
                  setDraft(next);
                  if (!open) setOpen(true);
                }}
                onFocus={(event) => {
                  setOpen(true);
                  if (!dirty) {
                    setDraft(selectedLabel);
                    window.requestAnimationFrame(() => event.currentTarget.select());
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && open) {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                  }
                }}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-2 luxia-type-input-value text-[var(--luxia-text-primary)] outline-none"
              />
              {canClear ? (
                <button
                  type="button"
                  className="flex size-7 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)] text-[var(--luxia-text-muted)] outline-none hover:bg-[var(--luxia-settings-hover-bg)] hover:text-[var(--luxia-text-primary)] focus-visible:shadow-[0_0_0_3px_var(--luxia-opacity-brand-secondary-24)]"
                  aria-label={`Clear ${label}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={handleClear}
                >
                  <XIcon className="size-3.5" strokeWidth={1.75} />
                </button>
              ) : null}
              <button
                type="button"
                tabIndex={-1}
                className="flex size-7 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)] text-[var(--luxia-text-muted)] outline-none hover:bg-[var(--luxia-settings-hover-bg)]"
                aria-label={`${open ? "Close" : "Open"} ${label} options`}
                aria-expanded={open}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={() => {
                  const next = !open;
                  setOpen(next);
                  if (next) inputRef.current?.focus();
                }}
              >
                <ChevronDownIcon
                  className={cn("size-4 transition-transform", open && "rotate-180")}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
            }
          }}
          style={menuWidth ? { width: menuWidth, minWidth: menuWidth } : undefined}
          className={cn(
            "p-0 overflow-hidden",
            "bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)]",
            "rounded-[var(--luxia-radius-12)] border shadow-[var(--luxia-shadow-md)]",
            "!z-[80] max-w-[min(24rem,calc(100vw-2rem))]",
            "max-h-[min(16rem,var(--radix-popover-content-available-height))]",
          )}
        >
          <CommandList
            id={listId}
            role="listbox"
            className="max-h-[min(16rem,var(--radix-popover-content-available-height))]"
          >
            {filtered.length === 0 ? (
              <p
                className="px-3 py-3 text-center luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
                role="status"
              >
                {emptyText}
              </p>
            ) : (
              <CommandGroup className="p-1">
                {filtered.map((option) => {
                  const isChosen = option.value === value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      role="option"
                      aria-selected={isChosen}
                      onSelect={() => handleSelect(option.value)}
                      className={cn(
                        "relative flex w-full cursor-default items-center gap-2 rounded-[var(--luxia-radius-8)] py-2 pr-8 pl-3",
                        "luxia-type-body-dense font-normal outline-hidden select-none",
                        "hover:bg-[var(--luxia-settings-hover-bg)]",
                        "data-[selected=true]:bg-[var(--luxia-settings-selected-bg)] data-[selected=true]:text-[var(--luxia-text-primary)]",
                        isChosen && "bg-[var(--luxia-settings-selected-bg)]",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {isChosen ? (
                        <span className="absolute right-2 flex size-3.5 items-center justify-center text-[var(--luxia-text-secondary)]">
                          <CheckIcon className="size-4" strokeWidth={1.75} />
                        </span>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  );
}
