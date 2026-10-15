import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Briefcase,
  Check,
  ChevronsUpDown,
  Files,
  FileText,
  Languages,
  List,
  MousePointer2,
  PenLine,
  Text,
  X,
  type LucideIcon,
} from "lucide-react";
import { LuxiaWritingAssistantIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { FieldError } from "@/app/features/shared/FieldValidation";
import { ChatSendButton } from "@/app/features/shared/ChatSendButton";
import { LuxiaSpinner } from "@/app/features/shared/Loading";
import { cn } from "@/app/components/ui/utils";
import { TRANSLATE_LANGUAGES } from "./languages";
import {
  WRITING_ASSISTANT_ACTIONS,
  WRITING_ASSISTANT_ERRORS,
  type WritingAssistantActionId,
} from "./types";

type ReferenceDocumentInfo = {
  name: string;
  format: "docx" | "txt" | "md";
};

type WritingAssistantPanelProps = {
  selectedText: string | null;
  question: string;
  suggestion: string | null;
  working: boolean;
  error: string | null;
  activeActionId: WritingAssistantActionId | null;
  translateLanguage: string | null;
  referenceDocument: ReferenceDocumentInfo | null;
  suggestionMeta?: string | null;
  onQuestionChange: (value: string) => void;
  onAction: (actionId: WritingAssistantActionId) => void;
  onTranslateLanguageChange: (code: string) => void;
  onReferenceDocumentChange: (file: ReferenceDocumentInfo | null) => void;
  onMatchReference: () => void;
  onSubmitQuestion: () => void;
  onReplace: () => void;
  onClearSelection: () => void;
};

const WORKING_LABELS: Record<WritingAssistantActionId, string> = {
  translate: "Translating selected text…",
  rewrite: "Rewriting selected text…",
  "make-formal": "Making selected text formal…",
  bulletize: "Converting selected text to bullets…",
  summarize: "Summarizing selected text…",
  "match-reference": "Matching selected text to the reference…",
};

const ACTION_ICONS: Record<WritingAssistantActionId, LucideIcon> = {
  translate: Languages,
  rewrite: PenLine,
  "make-formal": Briefcase,
  bulletize: List,
  summarize: Text,
  "match-reference": Files,
};

function ActionButtonLabel({
  actionId,
  label,
  active,
}: {
  actionId: WritingAssistantActionId;
  label: string;
  active: boolean;
}) {
  const Icon = ACTION_ICONS[actionId];
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <Icon
        size={14}
        strokeWidth={1.75}
        aria-hidden
        className={cn(
          "shrink-0",
          active
            ? "text-[var(--luxia-brand-primary)]"
            : "text-[var(--luxia-text-secondary)]",
        )}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

const SECTION_LABEL =
  "luxia-type-caption mb-2 block font-semibold tracking-[0.02em]";

const FORMAT_LABEL: Record<ReferenceDocumentInfo["format"], string> = {
  docx: "Word (.docx)",
  txt: "Plain text (.txt)",
  md: "Markdown (.md)",
};

function detectReferenceFormat(fileName: string): ReferenceDocumentInfo["format"] | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "md";
  return null;
}

export function WritingAssistantPanel({
  selectedText,
  question,
  suggestion,
  working,
  error,
  activeActionId,
  translateLanguage,
  referenceDocument,
  suggestionMeta,
  onQuestionChange,
  onAction,
  onTranslateLanguageChange,
  onReferenceDocumentChange,
  onMatchReference,
  onSubmitQuestion,
  onReplace,
  onClearSelection,
}: WritingAssistantPanelProps) {
  const errorId = useId();
  const askLabelId = useId();
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const hasSelection = Boolean(selectedText?.trim());
  const assistanceDisabled = !hasSelection || working;
  const showReplace = Boolean(suggestion) && hasSelection && !working;
  const showMatchReferenceDialog =
    hasSelection
    && activeActionId === "match-reference"
    && !working
    && !suggestion;
  const panelExpanded =
    hasSelection
    || Boolean(suggestion)
    || working
    || Boolean(error)
    || showMatchReferenceDialog;
  const workingLabel = activeActionId
    ? WORKING_LABELS[activeActionId]
    : "Working on selected text…";

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (assistanceDisabled) return;
    onSubmitQuestion();
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleAction(actionId: WritingAssistantActionId) {
    if (actionId === "translate") {
      setReferenceError(null);
      onAction(actionId);
      return;
    }
    if (actionId === "match-reference") {
      setLanguageOpen(false);
      setReferenceError(null);
      onAction(actionId);
      return;
    }
    setLanguageOpen(false);
    setReferenceError(null);
    onAction(actionId);
  }

  function handleReferenceFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const format = detectReferenceFormat(file.name);
    if (!format) {
      setReferenceError(WRITING_ASSISTANT_ERRORS.unsupportedReference);
      onReferenceDocumentChange(null);
      return;
    }
    setReferenceError(null);
    onReferenceDocumentChange({ name: file.name, format });
  }

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col overflow-hidden rounded-[10px] border shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "max-h-[min(42vh,20rem)] xl:w-[22.75rem] 2xl:w-[23.5rem]",
        panelExpanded
          ? "xl:max-h-full xl:min-h-0 xl:self-stretch"
          : "xl:max-h-none xl:self-start",
      )}
      style={{
        borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 18%, var(--luxia-border-default))",
        background: "var(--luxia-opacity-brand-primary-04, #FAFDFF)",
      }}
      aria-label="Writing Assistant"
    >
      <div
        className="flex shrink-0 items-center gap-2.5 border-b px-4 py-3.5"
        style={{
          borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 16%, var(--luxia-border-subtle))",
          background: "var(--luxia-opacity-brand-primary-08)",
        }}
      >
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--luxia-brand-primary)_18%,transparent)]"
          style={{ color: "var(--luxia-brand-primary)" }}
          aria-hidden
        >
          <LuxiaWritingAssistantIcon
            size={16}
            color="currentColor"
            accentColor="var(--luxia-purple-50)"
            aria-hidden
          />
        </span>
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: "var(--luxia-brand-primary)" }}
          >
            Writing Assistant
          </h2>
          <p
            className="mt-1 text-[11px] leading-snug"
            style={{ color: "var(--luxia-text-muted)" }}
          >
            Revise only what you select.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-messages",
          panelExpanded ? "min-h-0 flex-1" : "shrink-0",
        )}
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          {!hasSelection ? (
            <div
              className="flex items-start gap-2.5 rounded-[7px] border px-3 py-3"
              style={{
                borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 18%, var(--luxia-border-subtle))",
                background: "color-mix(in srgb, var(--luxia-opacity-brand-primary-08) 70%, white)",
              }}
            >
              <span
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center"
                style={{ color: "var(--luxia-brand-primary)" }}
                aria-hidden
              >
                <MousePointer2 size={15} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p
                  className="text-[12px] font-semibold leading-snug"
                  style={{ color: "var(--luxia-brand-primary)" }}
                >
                  Select text in the document to get assistance.
                </p>
                <p
                  className="mt-1 text-[11px] leading-snug"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  Then choose an action or ask a question.
                </p>
              </div>
            </div>
          ) : (
            <section className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3
                  className="luxia-type-caption font-semibold tracking-[0.02em]"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Selected text
                </h3>
                <button
                  type="button"
                  className="luxia-type-caption rounded-[4px] px-1 py-0.5 font-medium outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-brand-primary)] focus-visible:ring-offset-1 disabled:opacity-50"
                  style={{ color: "var(--luxia-text-muted)" }}
                  disabled={working}
                  aria-label="Clear selected text context"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setLanguageOpen(false);
                    setReferenceError(null);
                    onClearSelection();
                  }}
                >
                  Clear
                </button>
              </div>
              <div
                className="max-h-[7.5rem] overflow-y-auto rounded-[6px] border px-3 py-2.5 luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-messages"
                style={{
                  borderColor: "var(--luxia-border-subtle)",
                  background: "color-mix(in srgb, white 88%, var(--luxia-neutral-surface-subtle, #F7F6FA))",
                }}
              >
                <p
                  className="text-[12px] whitespace-pre-wrap break-words leading-[1.55]"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  {selectedText}
                </p>
              </div>
            </section>
          )}

          <section className="min-w-0">
            <h3
              className={SECTION_LABEL}
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Actions
            </h3>
            <div
              className="grid grid-cols-2 gap-1.5"
              role="group"
              aria-label="Assistance actions"
            >
              {WRITING_ASSISTANT_ACTIONS.map((action) => {
                const isTranslate = action.id === "translate";
                const isActive = isTranslate
                  ? languageOpen || (working && activeActionId === "translate")
                  : (
                    activeActionId === action.id
                    && (
                      working
                      || Boolean(suggestion)
                      || action.id === "match-reference"
                    )
                  );
                const buttonClassName = cn(
                  "h-9 min-h-9 w-full justify-between gap-1 rounded-[6px] px-2.5 text-left text-[11px] font-semibold leading-none shadow-none",
                  "border-[var(--luxia-border-default)] bg-white text-[var(--luxia-text-primary)]",
                  "hover:border-[color-mix(in_srgb,var(--luxia-brand-primary)_35%,var(--luxia-border-default))] hover:bg-[var(--luxia-opacity-brand-primary-08)] hover:text-[var(--luxia-brand-primary)]",
                  "hover:[&_svg]:text-[var(--luxia-brand-primary)]",
                  "focus-visible:ring-2 focus-visible:ring-[var(--luxia-brand-primary)] focus-visible:ring-offset-1",
                  "disabled:border-[color-mix(in_srgb,var(--luxia-border-default)_88%,var(--luxia-text-muted))] disabled:bg-[color-mix(in_srgb,white_82%,var(--luxia-neutral-surface-subtle,#F3F1F6))] disabled:text-[var(--luxia-text-secondary)] disabled:opacity-100",
                  "disabled:[&_svg]:text-[var(--luxia-text-secondary)] disabled:[&_svg]:opacity-90",
                  "disabled:hover:border-[color-mix(in_srgb,var(--luxia-border-default)_88%,var(--luxia-text-muted))] disabled:hover:bg-[color-mix(in_srgb,white_82%,var(--luxia-neutral-surface-subtle,#F3F1F6))] disabled:hover:text-[var(--luxia-text-secondary)]",
                  isActive
                    && "border-[var(--luxia-brand-primary)] bg-[var(--luxia-opacity-brand-primary-08)] text-[var(--luxia-text-primary)]",
                  isActive && working && "opacity-90",
                );

                if (isTranslate) {
                  return (
                    <Popover
                      key={action.id}
                      open={languageOpen}
                      onOpenChange={(open) => {
                        if (assistanceDisabled && open) return;
                        setLanguageOpen(open);
                        if (open) {
                          setReferenceError(null);
                          onAction("translate");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="compact"
                          disabled={assistanceDisabled}
                          aria-pressed={isActive || undefined}
                          aria-busy={working && activeActionId === "translate" ? true : undefined}
                          aria-expanded={languageOpen}
                          aria-haspopup="listbox"
                          onMouseDown={(event) => event.preventDefault()}
                          className={buttonClassName}
                        >
                          <ActionButtonLabel
                            actionId={action.id}
                            label={action.label}
                            active={isActive}
                          />
                          <ChevronsUpDown size={13} strokeWidth={1.75} className="shrink-0 opacity-60" aria-hidden />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="left"
                        align="start"
                        sideOffset={8}
                        collisionPadding={12}
                        className="w-56 p-0"
                        onOpenAutoFocus={(event) => {
                          event.preventDefault();
                          const target = event.currentTarget as HTMLElement | null;
                          window.requestAnimationFrame(() => {
                            target?.querySelector<HTMLInputElement>("input")?.focus();
                          });
                        }}
                        onEscapeKeyDown={() => setLanguageOpen(false)}
                      >
                        <Command>
                          <CommandInput placeholder="Search languages…" aria-label="Search languages" />
                          <CommandList className="max-h-[13.5rem] overflow-y-auto overscroll-contain">
                            <CommandEmpty>No language found.</CommandEmpty>
                            <CommandGroup>
                              {TRANSLATE_LANGUAGES.map((language) => (
                                <CommandItem
                                  key={language.code}
                                  value={language.label}
                                  onSelect={() => {
                                    onTranslateLanguageChange(language.code);
                                    setLanguageOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4 shrink-0",
                                      translateLanguage === language.code
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                    aria-hidden
                                  />
                                  <span className="truncate">{language.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }

                return (
                  <Button
                    key={action.id}
                    type="button"
                    variant="secondary"
                    size="compact"
                    disabled={assistanceDisabled}
                    aria-pressed={isActive || undefined}
                    aria-busy={isActive && working ? true : undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleAction(action.id)}
                    className={buttonClassName}
                  >
                    <ActionButtonLabel
                      actionId={action.id}
                      label={action.label}
                      active={isActive}
                    />
                    {action.id === "match-reference" ? (
                      <ChevronsUpDown size={13} strokeWidth={1.75} className="shrink-0 opacity-60" aria-hidden />
                    ) : null}
                  </Button>
                );
              })}
            </div>

            {showMatchReferenceDialog ? (
              <div
                className="mt-3 rounded-[7px] border px-3 py-3"
                style={{
                  borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 18%, var(--luxia-border-subtle))",
                  background: "var(--luxia-opacity-brand-primary-04)",
                }}
                role="region"
                aria-label="Match a reference document"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className="text-[12px] font-semibold leading-snug"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      Match a reference document
                    </h3>
                    <p
                      className="mt-1 text-[11px] leading-snug"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      Upload a document to adapt the selected text to its tone and writing style.
                    </p>
                  </div>
                </div>

                <input
                  ref={referenceInputRef}
                  type="file"
                  accept=".docx,.txt,.md,.markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                  className="sr-only"
                  onChange={handleReferenceFileChange}
                />

                {referenceDocument ? (
                  <div
                    className="mb-2.5 flex items-start gap-2 rounded-[6px] border bg-white px-2.5 py-2"
                    style={{ borderColor: "var(--luxia-border-default)" }}
                  >
                    <FileText
                      size={15}
                      strokeWidth={1.75}
                      className="mt-0.5 shrink-0"
                      style={{ color: "var(--luxia-brand-primary)" }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[12px] font-medium leading-snug"
                        style={{ color: "var(--luxia-text-primary)" }}
                        title={referenceDocument.name}
                      >
                        {referenceDocument.name}
                      </p>
                      <p
                        className="mt-0.5 text-[11px] leading-snug"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {FORMAT_LABEL[referenceDocument.format]}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="luxia-type-caption rounded-[5px] px-1.5 py-0.5 font-semibold"
                        style={{ color: "var(--luxia-brand-primary)" }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => referenceInputRef.current?.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="inline-flex size-6 items-center justify-center rounded-[5px]"
                        style={{ color: "var(--luxia-text-muted)" }}
                        aria-label="Remove reference document"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setReferenceError(null);
                          onReferenceDocumentChange(null);
                        }}
                      >
                        <X size={14} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="compact"
                    disabled={working}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => referenceInputRef.current?.click()}
                    className="mb-2.5 h-9 w-full justify-start gap-2 bg-white text-left"
                  >
                    <FileText size={15} strokeWidth={1.75} aria-hidden />
                    Choose reference document
                  </Button>
                )}

                {referenceError ? (
                  <p
                    className="mb-2 text-[11px] leading-snug"
                    style={{ color: "var(--luxia-error-70, #B91C1C)" }}
                    role="alert"
                  >
                    {referenceError}
                  </p>
                ) : null}

                <Button
                  type="button"
                  variant="primary"
                  size="compact"
                  className="h-9 w-full"
                  disabled={working || !referenceDocument}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={onMatchReference}
                >
                  Adapt selected text
                </Button>
                <p
                  className="mt-1.5 text-[11px] leading-snug"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  Only the selected passage will be adapted. Your current document stays as is until you replace.
                </p>
              </div>
            ) : null}
          </section>

          <section className="min-w-0">
            <label
              id={askLabelId}
              htmlFor="wa-ask-selection"
              className={SECTION_LABEL}
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              Ask about this selection
            </label>
            <form
              className={cn(
                "flex items-center gap-2 rounded-[6px] border py-1.5 pr-1.5 pl-3",
                !assistanceDisabled
                  && "bg-white focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--luxia-brand-primary)_20%,transparent)]",
              )}
              style={{
                borderColor: assistanceDisabled
                  ? "var(--luxia-border-default)"
                  : "color-mix(in srgb, var(--luxia-brand-primary) 22%, var(--luxia-border-default))",
                background: assistanceDisabled
                  ? "color-mix(in srgb, white 78%, var(--luxia-neutral-surface-subtle, #F3F1F6))"
                  : undefined,
              }}
              onSubmit={handleSubmit}
            >
              <Input
                id="wa-ask-selection"
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                onKeyDown={handleQuestionKeyDown}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (!assistanceDisabled) {
                    event.currentTarget.focus();
                  }
                }}
                placeholder="Ask about this selection…"
                disabled={assistanceDisabled}
                aria-labelledby={askLabelId}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  "h-10 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
                  assistanceDisabled && "disabled:cursor-not-allowed disabled:opacity-100",
                )}
              />
              <ChatSendButton
                type="submit"
                canSend={!assistanceDisabled && Boolean(question.trim())}
                busy={working}
                busyLabel="Sending"
                aria-label="Send"
                onMouseDown={(event) => event.preventDefault()}
              />
            </form>
          </section>

          {hasSelection ? (
            <section className="min-w-0" aria-live="polite">
              {working ? (
                <div
                  className="flex items-center gap-2.5 rounded-[7px] border px-3 py-3"
                  style={{
                    borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 18%, var(--luxia-border-subtle))",
                    background: "color-mix(in srgb, white 70%, var(--luxia-opacity-brand-primary-08))",
                  }}
                >
                  <LuxiaSpinner size={16} label={workingLabel} />
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold leading-snug"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {workingLabel}
                    </p>
                    <p
                      className="mt-0.5 text-[11px] leading-snug"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      Your original text is unchanged.
                    </p>
                  </div>
                </div>
              ) : suggestion ? (
                <div className="flex flex-col gap-2.5">
                  <div className="min-w-0">
                    {suggestionMeta ? (
                      <p
                        className="mb-1.5 text-[11.5px] font-medium leading-snug"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {suggestionMeta}
                      </p>
                    ) : null}
                    <h3
                      className={SECTION_LABEL}
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Suggestion
                    </h3>
                    <div
                      className="max-h-[12rem] overflow-y-auto rounded-[7px] border px-3 py-3 luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-messages"
                      style={{
                        borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 28%, var(--luxia-border-default))",
                        background: "var(--luxia-opacity-brand-primary-08)",
                      }}
                    >
                      <p
                        className="text-[12px] whitespace-pre-wrap break-words leading-[1.6]"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {suggestion}
                      </p>
                    </div>
                  </div>
                  {showReplace ? (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="primary"
                            size="compact"
                            className="h-9 w-full gap-1.5"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={onReplace}
                          >
                            <Check size={15} strokeWidth={1.75} aria-hidden />
                            Replace selected text
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Replace the selected passage with this suggestion
                        </TooltipContent>
                      </Tooltip>
                      <p
                        className="text-[11px] leading-snug"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Only the selected passage will be replaced.
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {error ? <FieldError id={errorId}>{error}</FieldError> : null}
        </div>
      </div>
    </aside>
  );
}
