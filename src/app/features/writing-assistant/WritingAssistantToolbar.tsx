import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Eraser,
  Eye,
  EyeOff,
  MessageSquarePlus,
  Redo2,
  RemoveFormatting,
  Search,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import {
  FONT_SIZE_OPTIONS,
  HIGHLIGHT_COLOR_OPTIONS,
  TEXT_COLOR_OPTIONS,
  type BlockStyle,
  type EditorCommand,
  type FontSizeOption,
} from "./editorCommands";
export type ToolbarActiveState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  justifyFull: boolean;
  unordered: boolean;
  ordered: boolean;
  canUndo: boolean;
  canRedo: boolean;
  blockStyle: BlockStyle;
  fontSize: FontSizeOption | "";
  textColor: string | null;
  highlightColor: string | null;
};

type WritingAssistantToolbarProps = {
  active: ToolbarActiveState;
  disabled?: boolean;
  searchOpen?: boolean;
  showChanges?: boolean;
  onCommand: (command: EditorCommand) => void;
  onBlockStyle: (style: BlockStyle) => void;
  onFontSize: (size: FontSizeOption) => void;
  onTextColor: (color: string | null) => void;
  onHighlightColor: (color: string | null) => void;
  onInsertImage: (file: File) => void;
  onToggleSearch: () => void;
  onToggleShowChanges: () => void;
  onClearChangeMarkers: () => void;
  onAddComment: () => void;
  onPreserveSelection: () => void;
};

function ToolbarIconButton({
  label,
  onClick,
  disabled,
  pressed,
  onPreserveSelection,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  onPreserveSelection?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="iconCompact"
          aria-label={label}
          aria-pressed={pressed || undefined}
          disabled={disabled}
          onMouseDown={(event) => {
            // Capture the live editor range before focus moves, then prevent
            // the default so the contenteditable selection is not cleared.
            onPreserveSelection?.();
            event.preventDefault();
          }}
          onClick={onClick}
          className="wa-tb-icon size-8 shrink-0"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarGroup({
  label,
  showTrailingDivider = true,
  clustered = false,
  children,
}: {
  label: string;
  showTrailingDivider?: boolean;
  clustered?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex items-center",
        clustered
          ? "wa-tb-cluster gap-0 rounded-[6px] border p-0.5"
          : "gap-0.5",
        showTrailingDivider
          && "wa-tb-divider after:mx-3 after:block after:h-5 after:w-px after:shrink-0 after:self-center after:content-['']",
      )}
    >
      {children}
    </div>
  );
}

function ColorSwatchButton({
  label,
  color,
  selected,
  onSelect,
}: {
  label: string;
  color: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          aria-pressed={selected}
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            onSelect();
          }}
          className={cn(
            "relative flex size-7 items-center justify-center rounded-[6px] border transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-brand-primary)]",
            selected
              ? "border-[var(--luxia-brand-primary)] ring-1 ring-[var(--luxia-brand-primary)]"
              : "border-[var(--luxia-border-default)] hover:border-[var(--luxia-border-strong,var(--luxia-border-default))]",
          )}
          style={{ background: color ?? "transparent" }}
        >
          {color === null ? (
            <span
              className="absolute inset-[5px] rounded-[2px]"
              style={{
                background:
                  "linear-gradient(to top right, transparent calc(50% - 0.5px), #B91C1C 0, #B91C1C calc(50% + 0.5px), transparent 0)",
              }}
              aria-hidden
            />
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function TextColorControl({
  value,
  disabled,
  onPreserveSelection,
  onChange,
}: {
  value: string | null;
  disabled?: boolean;
  onPreserveSelection: () => void;
  onChange: (color: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const swatch = value ?? "var(--luxia-text-primary)";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) onPreserveSelection();
        setOpen(next);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              disabled={disabled}
              aria-label="Text color"
              aria-haspopup="dialog"
              onMouseDown={(event) => event.preventDefault()}
              className={cn("wa-tb-icon relative size-8 shrink-0", disabled && "opacity-45")}
            >
              <span
                className="luxia-type-caption font-semibold leading-none"
                style={{ color: "var(--wa-chrome-icon, var(--luxia-brand-primary, #30214E))" }}
                aria-hidden
              >
                A
              </span>
              <span
                className="absolute inset-x-1.5 bottom-1 h-0.5 rounded-full"
                style={{ background: swatch }}
                aria-hidden
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Text color</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="w-auto p-2.5"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p
          className="luxia-type-caption mb-2 font-semibold"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          Text color
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {TEXT_COLOR_OPTIONS.map((option) => (
            <ColorSwatchButton
              key={option.id}
              label={option.label}
              color={option.value}
              selected={
                option.value === null
                  ? value === null
                  : value?.toUpperCase() === option.value.toUpperCase()
              }
              onSelect={() => {
                // Do not re-capture here — selection is already in the popover.
                // Use the range preserved when the popover opened.
                onChange(option.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HighlightColorControl({
  value,
  disabled,
  onPreserveSelection,
  onChange,
}: {
  value: string | null;
  disabled?: boolean;
  onPreserveSelection: () => void;
  onChange: (color: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) onPreserveSelection();
        setOpen(next);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconCompact"
              disabled={disabled}
              aria-label="Highlight color"
              aria-haspopup="dialog"
              onMouseDown={(event) => event.preventDefault()}
              className={cn("wa-tb-icon relative size-8 shrink-0", disabled && "opacity-45")}
            >
              <Highlighter size={16} strokeWidth={1.75} aria-hidden />
              <span
                className="absolute inset-x-1.5 bottom-1 h-0.5 rounded-full"
                style={{ background: value ?? "var(--luxia-border-default)" }}
                aria-hidden
              />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Highlight color</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="w-auto p-2.5"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p
          className="luxia-type-caption mb-2 font-semibold"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          Highlight color
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {HIGHLIGHT_COLOR_OPTIONS.map((option) => (
            <ColorSwatchButton
              key={option.id}
              label={option.label}
              color={option.value}
              selected={
                option.value === null
                  ? value === null
                  : value?.toUpperCase() === option.value.toUpperCase()
              }
              onSelect={() => {
                // Do not re-capture here — selection is already in the popover.
                // Use the range preserved when the popover opened.
                onChange(option.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const BLOCK_OPTIONS: { value: BlockStyle; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

export function WritingAssistantToolbar({
  active,
  disabled = false,
  searchOpen = false,
  showChanges = true,
  onCommand,
  onBlockStyle,
  onFontSize,
  onTextColor,
  onHighlightColor,
  onInsertImage,
  onToggleSearch,
  onToggleShowChanges,
  onClearChangeMarkers,
  onAddComment,
  onPreserveSelection,
}: WritingAssistantToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onInsertImage(file);
  }

  return (
    <div
      role="toolbar"
      aria-label="Document editing"
      className="wa-doc-toolbar flex w-full min-w-0 flex-wrap items-center gap-x-0 gap-y-1.5 overflow-x-visible px-2.5 py-2 sm:px-3"
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        hidden
        onChange={handleImageChange}
      />

      <ToolbarGroup label="History">
        <ToolbarIconButton
          label="Undo"
          disabled={disabled || !active.canUndo}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("undo")}
        >
          <Undo2 size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Redo"
          disabled={disabled || !active.canRedo}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("redo")}
        >
          <Redo2 size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
      </ToolbarGroup>

      <ToolbarGroup label="Find">
        <ToolbarIconButton
          label="Find in document"
          disabled={disabled}
          pressed={searchOpen}
          onClick={onToggleSearch}
        >
          <Search size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
      </ToolbarGroup>

      <ToolbarGroup label="Block">
        <Select
          value={active.blockStyle}
          disabled={disabled}
          onOpenChange={(open) => {
            if (open) onPreserveSelection();
          }}
          onValueChange={(value) => onBlockStyle(value as BlockStyle)}
        >
          <SelectTrigger
            size="sm"
            aria-label="Paragraph style"
            className="wa-tb-select h-8 min-h-8 w-[7.5rem]"
            onMouseDown={(event) => event.preventDefault()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={active.fontSize || undefined}
          disabled={disabled}
          onOpenChange={(open) => {
            if (open) onPreserveSelection();
          }}
          onValueChange={(value) => onFontSize(value as FontSizeOption)}
        >
          <SelectTrigger
            size="sm"
            aria-label="Font size"
            className="wa-tb-select h-8 min-h-8 w-[5.25rem]"
            onMouseDown={(event) => event.preventDefault()}
          >
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ToolbarGroup>

      <ToolbarGroup label="Formatting">
        <ToolbarIconButton
          label="Bold"
          disabled={disabled}
          pressed={active.bold}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("bold")}
        >
          <Bold size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Italic"
          disabled={disabled}
          pressed={active.italic}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("italic")}
        >
          <Italic size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Underline"
          disabled={disabled}
          pressed={active.underline}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("underline")}
        >
          <Underline size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Strikethrough"
          disabled={disabled}
          pressed={active.strikeThrough}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("strikeThrough")}
        >
          <Strikethrough size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <TextColorControl
          value={active.textColor}
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onChange={onTextColor}
        />
        <HighlightColorControl
          value={active.highlightColor}
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onChange={onHighlightColor}
        />
        <ToolbarIconButton
          label="Clear formatting"
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("removeFormat")}
        >
          <RemoveFormatting size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
      </ToolbarGroup>

      <ToolbarGroup label="Paragraph">
        <ToolbarIconButton
          label="Align left"
          disabled={disabled}
          pressed={active.justifyLeft}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("justifyLeft")}
        >
          <AlignLeft size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Align center"
          disabled={disabled}
          pressed={active.justifyCenter}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("justifyCenter")}
        >
          <AlignCenter size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Align right"
          disabled={disabled}
          pressed={active.justifyRight}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("justifyRight")}
        >
          <AlignRight size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Justify"
          disabled={disabled}
          pressed={active.justifyFull}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("justifyFull")}
        >
          <AlignJustify size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Bullet list"
          disabled={disabled}
          pressed={active.unordered}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("insertUnorderedList")}
        >
          <List size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Numbered list"
          disabled={disabled}
          pressed={active.ordered}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("insertOrderedList")}
        >
          <ListOrdered size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Decrease indent"
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("outdent")}
        >
          <IndentDecrease size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Increase indent"
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onClick={() => onCommand("indent")}
        >
          <IndentIncrease size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
      </ToolbarGroup>

      <ToolbarGroup label="Review" showTrailingDivider={false} clustered>
        <ToolbarIconButton
          label="Add comment"
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onClick={onAddComment}
        >
          <MessageSquarePlus size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Insert image"
          disabled={disabled}
          onPreserveSelection={onPreserveSelection}
          onClick={() => imageInputRef.current?.click()}
        >
          <ImagePlus size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
        <ToolbarIconButton
          label={showChanges ? "Hide changes" : "Show changes"}
          disabled={disabled}
          pressed={showChanges}
          onClick={onToggleShowChanges}
        >
          {showChanges ? (
            <Eye size={16} strokeWidth={1.75} aria-hidden />
          ) : (
            <EyeOff size={16} strokeWidth={1.75} aria-hidden />
          )}
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Clear change markers"
          disabled={disabled}
          onClick={onClearChangeMarkers}
        >
          <Eraser size={16} strokeWidth={1.75} aria-hidden />
        </ToolbarIconButton>
      </ToolbarGroup>
    </div>
  );
}
