import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  appendCapturedAssistantTurn,
  appendCapturedVisitorTurn,
  clearActiveCapturedSession,
  createCapturedVidgetInboxSession,
  getActiveCapturedSessionId,
  getCapturedVidgetInboxSessionById,
  updateCapturedAssistantFeedback,
} from "@/app/features/vidget-inbox/sessionStore";
import type { VidgetInboxFeedback, VidgetInboxTurn } from "@/app/features/vidget-inbox/types";
import { normalizeVidgetRoutingMode } from "./data";
import {
  VIDGET_AVATARS,
  VIDGET_THEMES,
  type VidgetExperienceMode,
  type VidgetPreviewDevice,
  type VidgetRecord,
} from "./types";
import {
  nextVidgetTestMessageId,
  requestVidgetTestResponse,
  resolveVidgetTestEligibility,
  type VidgetTestContextInput,
  type VidgetTestMessage,
} from "./vidgetTestChat";
import {
  buildVisitorAssistantOptions,
  isVisitorAssistantStillEligible,
  type VidgetVisitorAssistantOption,
} from "./visitorAssistants";

const PREVIEW_MODES: { id: VidgetPreviewDevice; label: string }[] = [
  { id: "desktop", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "totem", label: "Totem" },
];

/** Prototype theme accents — Luxia tokens, not reference screenshot colors. */
const THEME_ACCENTS: Record<
  string,
  { primary: string; primarySoft: string; onPrimary: string; chatBg: string }
> = {
  "theme-default": {
    primary: "var(--luxia-brand-primary)",
    primarySoft: "var(--luxia-opacity-brand-primary-08)",
    onPrimary: "#fff",
    chatBg: "var(--luxia-surface-subtle)",
  },
  "theme-01": {
    primary: "#2F6FED",
    primarySoft: "rgba(47, 111, 237, 0.1)",
    onPrimary: "#fff",
    chatBg: "#F4F8FF",
  },
  "theme-02": {
    primary: "#0F766E",
    primarySoft: "rgba(15, 118, 110, 0.1)",
    onPrimary: "#fff",
    chatBg: "#F2FAF9",
  },
};

type ThemeAccent = (typeof THEME_ACCENTS)[string];

type PreviewDisplayMode = "avatar-frame" | "text-only";

type VidgetTestSession = {
  messages: VidgetTestMessage[];
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  send: () => void;
  reset: () => void;
  setFeedback: (messageId: string, feedback: VidgetInboxFeedback) => void;
  canSend: boolean;
  testBlockedReason?: string;
  showTestHint: boolean;
  conversationEndRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Galaxy visitor routing */
  visitorMode: boolean;
  visitorAssistants: VidgetVisitorAssistantOption[];
  selectedAssistantId: string | null;
  selectedAssistant: VidgetVisitorAssistantOption | null;
  needsAssistantSelection: boolean;
  noAssistantsAvailable: boolean;
  selectAssistant: (id: string) => void;
  composerDisabled: boolean;
};

function previewMessagesFromTurns(turns: readonly VidgetInboxTurn[]): VidgetTestMessage[] {
  return turns.map((turn) => (
    turn.role === "visitor"
      ? { id: turn.id, role: "user" as const, content: turn.content }
      : {
          id: turn.id,
          role: "assistant" as const,
          content: turn.content,
          feedback: turn.feedback,
        }
  ));
}

function useVidgetTestSession(
  record: VidgetRecord,
  testContext: VidgetTestContextInput,
  previewResetKey: number | undefined,
): VidgetTestSession {
  const [messages, setMessages] = useState<VidgetTestMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const previewResetKeyRef = useRef(previewResetKey);

  const eligibility = useMemo(
    () => resolveVidgetTestEligibility(record, testContext),
    [record, testContext],
  );

  const routingMode = normalizeVidgetRoutingMode(record.sourceType, record.routingMode);
  const visitorMode = record.sourceType === "galaxy" && routingMode === "visitor";

  const visitorAssistants = useMemo(
    () =>
      visitorMode
        ? buildVisitorAssistantOptions(record, testContext.constellationOptions)
        : [],
    [visitorMode, record, testContext.constellationOptions],
  );

  const selectedAssistant = useMemo(
    () => visitorAssistants.find((item) => item.id === selectedAssistantId) ?? null,
    [visitorAssistants, selectedAssistantId],
  );

  const selectionValid = isVisitorAssistantStillEligible(
    selectedAssistantId,
    visitorAssistants,
  );

  useEffect(() => {
    if (!visitorMode && selectedAssistantId) {
      setSelectedAssistantId(null);
    }
  }, [visitorMode, selectedAssistantId]);

  const needsAssistantSelection =
    visitorMode
    && eligibility.canTest
    && !selectionValid
    && visitorAssistants.length > 0;
  const noAssistantsAvailable =
    visitorMode && eligibility.canTest && visitorAssistants.length === 0;
  const composerDisabled =
    Boolean(!eligibility.canTest)
    || (visitorMode && (!selectionValid || visitorAssistants.length === 0));

  const resetConversation = useCallback((clearActive: boolean) => {
    if (clearActive) clearActiveCapturedSession(record.id);
    activeSessionIdRef.current = null;
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
    setSelectedAssistantId(null);
  }, [record.id]);

  const scopeKey = record.galaxyConstellationIds.join("|");
  const routingConfigKey = `${record.sourceType}|${normalizeVidgetRoutingMode(record.sourceType, record.routingMode)}|${scopeKey}`;
  const prevRoutingConfigRef = useRef({ recordId: record.id, key: routingConfigKey });

  useEffect(() => {
    const resetTriggered = previewResetKeyRef.current !== previewResetKey;
    previewResetKeyRef.current = previewResetKey;
    setInputValue("");
    setIsLoading(false);
    setSelectedAssistantId(null);
    if (resetTriggered) {
      clearActiveCapturedSession(record.id);
      activeSessionIdRef.current = null;
      setMessages([]);
      return;
    }
    const activeId = getActiveCapturedSessionId(record.id);
    const session = activeId ? getCapturedVidgetInboxSessionById(activeId) : undefined;
    if (session && session.vidgetId === record.id) {
      activeSessionIdRef.current = session.id;
      setMessages(previewMessagesFromTurns(session.turns));
      return;
    }
    activeSessionIdRef.current = null;
    setMessages([]);
  }, [record.id, previewResetKey]);

  useEffect(() => {
    const prev = prevRoutingConfigRef.current;
    prevRoutingConfigRef.current = { recordId: record.id, key: routingConfigKey };
    if (prev.recordId !== record.id) return;
    if (prev.key === routingConfigKey) return;
    setSelectedAssistantId(null);
    activeSessionIdRef.current = null;
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
    clearActiveCapturedSession(record.id);
  }, [record.id, routingConfigKey]);

  useEffect(() => {
    if (!visitorMode) return;
    if (!selectedAssistantId || selectionValid) return;
    setSelectedAssistantId(null);
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
    activeSessionIdRef.current = null;
    clearActiveCapturedSession(record.id);
  }, [visitorMode, selectedAssistantId, selectionValid, record.id]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isLoading, selectedAssistantId, needsAssistantSelection]);

  const selectAssistant = useCallback((id: string) => {
    if (!visitorAssistants.some((item) => item.id === id)) return;
    setSelectedAssistantId(id);
  }, [visitorAssistants]);

  const send = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || !eligibility.canTest) return;
    if (visitorMode && !selectionValid) return;

    let sessionId = activeSessionIdRef.current;
    if (!sessionId) {
      sessionId = createCapturedVidgetInboxSession({ record }).id;
      activeSessionIdRef.current = sessionId;
    }

    const userMessage: VidgetTestMessage = {
      id: nextVidgetTestMessageId(),
      role: "user",
      content: trimmed,
    };
    appendCapturedVisitorTurn(sessionId, {
      id: userMessage.id,
      content: trimmed,
    });
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    void requestVidgetTestResponse({
      record,
      userMessage: trimmed,
      context: testContext,
      selectedAssistantId: visitorMode ? selectedAssistantId : null,
    })
      .then((result) => {
        const assistantId = nextVidgetTestMessageId();
        if (result.ok) {
          appendCapturedAssistantTurn(sessionId, {
            id: assistantId,
            content: result.content,
            sources: result.sources,
            constellationId: result.constellationId,
            presentation: "normal",
          });
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: result.content,
              feedback: "none",
            },
          ]);
          return;
        }
        appendCapturedAssistantTurn(sessionId, {
          id: assistantId,
          content: result.error,
          constellationId: null,
          presentation: "normal",
        });
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant-error",
            content: result.error,
          },
        ]);
      })
      .catch(() => {
        const assistantId = nextVidgetTestMessageId();
        appendCapturedAssistantTurn(sessionId, {
          id: assistantId,
          content: "Something went wrong while testing this Vidget. Try again.",
          constellationId: null,
          presentation: "normal",
        });
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant-error",
            content: "Something went wrong while testing this Vidget. Try again.",
          },
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    eligibility.canTest,
    inputValue,
    isLoading,
    record,
    testContext,
    visitorMode,
    selectionValid,
    selectedAssistantId,
  ]);

  const setFeedback = useCallback((messageId: string, feedback: VidgetInboxFeedback) => {
    setMessages((prev) =>
      prev.map((message) => (
        message.id === messageId ? { ...message, feedback } : message
      )),
    );
    const sessionId = activeSessionIdRef.current;
    if (sessionId) updateCapturedAssistantFeedback(sessionId, messageId, feedback);
  }, []);

  const canSend =
    eligibility.canTest
    && !composerDisabled
    && !isLoading
    && inputValue.trim().length > 0;
  const showTestHint =
    eligibility.canTest
    && !visitorMode
    && messages.length === 0
    && !isLoading;

  return {
    messages,
    isLoading,
    inputValue,
    setInputValue,
    send,
    reset: () => resetConversation(true),
    setFeedback,
    canSend,
    testBlockedReason: eligibility.canTest ? undefined : eligibility.reason,
    showTestHint,
    conversationEndRef,
    visitorMode,
    visitorAssistants,
    selectedAssistantId: selectionValid ? selectedAssistantId : null,
    selectedAssistant: selectionValid ? selectedAssistant : null,
    needsAssistantSelection,
    noAssistantsAvailable,
    selectAssistant,
    composerDisabled,
  };
}

function previewDisplayFromExperience(mode: VidgetExperienceMode): PreviewDisplayMode {
  return mode === "avatar" ? "avatar-frame" : "text-only";
}

function PreviewDisplayToggle({
  accent,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
  compact = false,
  trailingControl,
}: {
  accent: ThemeAccent;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
  compact?: boolean;
  trailingControl?: ReactNode;
}) {
  const buttonSize = compact ? "h-4 w-4" : "h-5 w-5";
  const fontSize = compact ? "0.5625rem" : "0.625rem";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full ${
        compact ? "gap-0.5 px-1.5 py-0.5" : "gap-1 px-2 py-1"
      }`}
      style={{ background: "rgba(255,255,255,0.22)" }}
      role="group"
      aria-label="Preview display mode"
    >
      <button
        type="button"
        aria-label="Preview with avatar"
        aria-pressed={avatarFrameActive}
        title="Preview with avatar"
        className={`inline-flex ${buttonSize} items-center justify-center rounded-full luxia-type-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80`}
        style={{
          background: avatarFrameActive ? "#fff" : "rgba(255,255,255,0.5)",
          color: accent.primary,
          fontSize,
        }}
        onClick={onSelectAvatarFrame}
      >
        A
      </button>
      <button
        type="button"
        aria-label="Preview text only"
        aria-pressed={!avatarFrameActive}
        title="Preview text only"
        className={`inline-flex ${buttonSize} items-center justify-center rounded-full luxia-type-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80`}
        style={{
          background: !avatarFrameActive ? "#fff" : "rgba(255,255,255,0.5)",
          color: accent.primary,
          fontSize,
        }}
        onClick={onSelectTextOnly}
      >
        ⌨
      </button>
      {trailingControl}
    </span>
  );
}

function frameLayout(
  device: VidgetPreviewDevice,
  splitAvatar: boolean,
): { maxWidth: string; height: string } {
  if (device === "desktop") {
    return splitAvatar
      ? { maxWidth: "36rem", height: "20.5rem" }
      : { maxWidth: "26rem", height: "19.5rem" };
  }
  if (device === "mobile") {
    return { maxWidth: "17.5rem", height: "28rem" };
  }
  if (device === "totem") {
    return { maxWidth: "20.5rem", height: "36rem" };
  }
  return { maxWidth: "26rem", height: "19.5rem" };
}

function chatBackground(record: VidgetRecord, accent: ThemeAccent): string {
  if (record.backgroundImageName) {
    return "linear-gradient(165deg, #FAFDFF 0%, #F3EEFF 48%, #EAF6FF 100%)";
  }
  return accent.chatBg;
}

function PreviewModeTabs({
  device,
  onDeviceChange,
}: {
  device: VidgetPreviewDevice;
  onDeviceChange?: (device: VidgetPreviewDevice) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 border-b pb-0"
      style={{ borderColor: "var(--luxia-border-subtle)" }}
      role="tablist"
      aria-label="Preview mode"
    >
      {PREVIEW_MODES.map((mode) => {
        const selected = device === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={!onDeviceChange}
            className="border-b-2 bg-transparent px-1 pb-2.5 pt-0.5 luxia-type-body-small outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:cursor-default"
            style={{
              color: selected ? "var(--luxia-text-primary)" : "var(--luxia-text-muted)",
              borderColor: selected ? "var(--luxia-brand-primary)" : "transparent",
            }}
            onClick={() => onDeviceChange?.(mode.id)}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function SoftChannelPlaceholder({
  channelLabel,
  title,
  detail,
}: {
  channelLabel: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-4 py-4">
      <p
        className="luxia-type-overline-data"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {channelLabel}
      </p>
      <div
        className="w-full max-w-sm rounded-[var(--luxia-radius-16)] px-5 py-8 text-center"
        style={{
          border: "1px solid var(--luxia-border-subtle)",
          background: "var(--luxia-surface-subtle)",
        }}
      >
        <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
          {title}
        </p>
        <p className="mt-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function LandingPageHeader({
  record,
  accent,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5"
      style={{ background: accent.primary }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {record.companyLogoName || record.chatBubbleLogoName ? (
          <span
            className="inline-flex h-7 w-10 shrink-0 items-center justify-center rounded-[4px] bg-white luxia-type-caption"
            style={{ color: accent.primary }}
          >
            Logo
          </span>
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-white/95">
            <LuxiaStarLogo size={18} />
          </span>
        )}
      </div>
      <p
        className="min-w-0 flex-1 truncate text-center luxia-type-caption"
        style={{ color: accent.onPrimary }}
      >
        Powered by Luxia
      </p>
      <PreviewDisplayToggle
        accent={accent}
        avatarFrameActive={avatarFrameActive}
        onSelectAvatarFrame={onSelectAvatarFrame}
        onSelectTextOnly={onSelectTextOnly}
      />
    </div>
  );
}

function PreviewFeedbackButtons({
  feedback = "none",
  onChange,
  compact = false,
}: {
  feedback?: VidgetInboxFeedback;
  onChange: (next: VidgetInboxFeedback) => void;
  compact?: boolean;
}) {
  const iconSize = compact ? 11 : 13;
  return (
    <div className="mt-1 flex items-center gap-0.5">
      <button
        type="button"
        aria-label="Like"
        aria-pressed={feedback === "positive"}
        className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        onClick={() => onChange(feedback === "positive" ? "none" : "positive")}
      >
        <ThumbsUp
          size={iconSize}
          strokeWidth={1.8}
          aria-hidden
          fill={feedback === "positive" ? "currentColor" : "none"}
          style={{
            color: feedback === "positive"
              ? "var(--luxia-brand-primary)"
              : "var(--luxia-text-muted)",
          }}
        />
      </button>
      <button
        type="button"
        aria-label="Dislike"
        aria-pressed={feedback === "negative"}
        className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        onClick={() => onChange(feedback === "negative" ? "none" : "negative")}
      >
        <ThumbsDown
          size={iconSize}
          strokeWidth={1.8}
          aria-hidden
          fill={feedback === "negative" ? "currentColor" : "none"}
          style={{
            color: feedback === "negative"
              ? "var(--luxia-warning-90)"
              : "var(--luxia-text-muted)",
          }}
        />
      </button>
    </div>
  );
}

function PreviewNewConversationButton({
  visible,
  onReset,
}: {
  visible: boolean;
  onReset: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="flex justify-center px-1">
      <button
        type="button"
        className="luxia-type-caption outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        style={{ color: "var(--luxia-text-muted)" }}
        onClick={onReset}
      >
        New conversation
      </button>
    </div>
  );
}

function VisitorUnavailableNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-[10px] border px-3 ${compact ? "py-2" : "py-2.5"}`}
      style={{
        borderColor: "var(--luxia-border-subtle)",
        background: "var(--luxia-surface)",
      }}
      role="status"
    >
      <p
        className="luxia-type-body-dense"
        style={{
          color: "var(--luxia-text-secondary)",
          fontSize: compact ? "0.75rem" : undefined,
        }}
      >
        No assistants are available right now.
      </p>
    </div>
  );
}

/** Visitor chooser elevation — Luxia tokens only; no side accents. */
const VISITOR_ASSISTANT_CARD_STYLE = `
.visitor-assistant-card {
  border-color: var(--luxia-border-default);
  background: var(--luxia-surface);
  box-shadow: var(--luxia-shadow-sm);
}
.visitor-assistant-card:hover {
  border-color: var(--luxia-brand-primary);
  background: var(--luxia-surface-subtle);
  box-shadow: var(--luxia-shadow-md);
}
.visitor-assistant-card:active,
.visitor-assistant-card[aria-selected="true"] {
  border-color: var(--luxia-brand-primary);
  background: var(--luxia-opacity-brand-primary-04);
  box-shadow: var(--luxia-shadow-sm);
}
.visitor-assistant-card[aria-selected="true"]:hover,
.visitor-assistant-card[aria-selected="true"]:active {
  border-color: var(--luxia-brand-primary);
  background: var(--luxia-opacity-brand-primary-04);
  box-shadow: var(--luxia-shadow-md);
}
`;

function VisitorAssistantChooser({
  assistants,
  accent,
  onSelect,
  compact = false,
}: {
  assistants: VidgetVisitorAssistantOption[];
  accent: ThemeAccent;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  void accent;
  const scrollable = assistants.length > 4;

  return (
    <div
      className="min-w-0 space-y-2"
      role="listbox"
      aria-label="Choose an assistant"
    >
      <style>{VISITOR_ASSISTANT_CARD_STYLE}</style>
      <p
        className="px-0.5 luxia-type-caption"
        style={{
          color: "var(--luxia-text-muted)",
          fontSize: compact ? "0.625rem" : undefined,
          fontWeight: 500,
        }}
      >
        Choose an assistant to continue
      </p>
      <div
        className={`min-w-0 space-y-2 ${scrollable ? "max-h-44 overflow-y-auto pr-0.5" : ""}`}
      >
        {assistants.map((assistant) => (
          <button
            key={assistant.id}
            type="button"
            role="option"
            aria-selected={false}
            className={`visitor-assistant-card flex w-full min-w-0 flex-col rounded-[10px] border text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
              compact ? "gap-0.5 px-2.5 py-2" : "gap-1 px-3 py-2.5"
            }`}
            onClick={() => onSelect(assistant.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(assistant.id);
              }
            }}
          >
            <span
              className="min-w-0 break-words luxia-type-body-dense-strong"
              style={{
                color: "var(--luxia-text-primary)",
                fontSize: compact ? "0.8125rem" : "0.875rem",
                fontWeight: 600,
              }}
            >
              {assistant.name}
            </span>
            <span
              className="min-w-0 break-words luxia-type-caption"
              style={{
                color: "var(--luxia-text-muted)",
                fontSize: compact ? "0.625rem" : "0.75rem",
                fontWeight: 400,
                lineHeight: 1.35,
              }}
            >
              {assistant.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveAssistantIndicator({
  name,
  compact = false,
  hasConversation = false,
  onChangeAssistant,
}: {
  name: string;
  compact?: boolean;
  /** True when transcript history would be cleared by changing assistant. */
  hasConversation?: boolean;
  onChangeAssistant: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestChange = () => {
    if (hasConversation) {
      setConfirmOpen(true);
      return;
    }
    onChangeAssistant();
  };

  return (
    <>
      <div
        className={`flex min-w-0 items-center gap-2 border-t px-3 ${compact ? "py-1.5" : "py-2"}`}
        style={{
          borderColor: "var(--luxia-border-subtle)",
          background: "var(--luxia-surface-subtle)",
        }}
      >
        <div
          className="flex min-w-0 flex-1 items-center gap-1.5"
          role="status"
          aria-live="polite"
          aria-label={`Active assistant: ${name}`}
        >
          <span
            className="shrink-0 luxia-type-caption"
            style={{
              color: "var(--luxia-text-muted)",
              fontSize: compact ? "0.625rem" : undefined,
              fontWeight: 500,
            }}
          >
            Assistant:
          </span>
          <span
            className="min-w-0 truncate luxia-type-caption"
            style={{
              color: "var(--luxia-text-primary)",
              fontSize: compact ? "0.625rem" : undefined,
            }}
            title={name}
          >
            {name}
          </span>
        </div>
        <button
          type="button"
          className="shrink-0 luxia-type-caption outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{
            color: "var(--luxia-brand-primary)",
            fontSize: compact ? "0.625rem" : undefined,
            fontWeight: 600,
          }}
          onClick={requestChange}
          aria-label="Change assistant"
        >
          Change assistant
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change assistant?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing assistant will start a new conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ background: "var(--luxia-brand-primary)" }}
              className="text-white hover:opacity-90"
              onClick={() => {
                setConfirmOpen(false);
                onChangeAssistant();
              }}
            >
              Change assistant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VisitorConversationBlock({
  testSession,
  accent,
  compact = false,
}: {
  testSession: VidgetTestSession;
  accent: ThemeAccent;
  compact?: boolean;
}) {
  if (!testSession.visitorMode) return null;
  if (testSession.noAssistantsAvailable) {
    return <VisitorUnavailableNotice compact={compact} />;
  }
  if (testSession.needsAssistantSelection) {
    return (
      <VisitorAssistantChooser
        assistants={testSession.visitorAssistants}
        accent={accent}
        onSelect={testSession.selectAssistant}
        compact={compact}
      />
    );
  }
  return null;
}

function MessageBubble({
  role,
  children,
  accent,
  bubbleSize,
  senderName,
  error = false,
  pending = false,
  feedback,
  onFeedback,
}: {
  role: "assistant" | "user";
  children: string;
  accent: ThemeAccent;
  bubbleSize: VidgetRecord["bubbleSize"];
  senderName: string;
  error?: boolean;
  pending?: boolean;
  feedback?: VidgetInboxFeedback;
  onFeedback?: (next: VidgetInboxFeedback) => void;
}) {
  const padY =
    bubbleSize === "lg" ? "py-2.5" : bubbleSize === "sm" ? "py-1.5" : "py-2";
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-[12px] px-3 ${padY}`}
        style={
          isUser
            ? { background: accent.primary, color: accent.onPrimary }
            : {
                background: error ? "var(--luxia-surface-subtle)" : "#fff",
                color: error ? "var(--luxia-text-secondary)" : "var(--luxia-text-primary)",
                border: `1px solid ${error ? "var(--luxia-border-default)" : "var(--luxia-border-subtle)"}`,
                opacity: pending ? 0.85 : 1,
              }
        }
      >
        <p
          className="mb-0.5 luxia-type-caption"
          style={{ opacity: isUser ? 0.9 : 0.75 }}
        >
          {senderName}
        </p>
        <p className="luxia-type-body-dense whitespace-pre-wrap">{children}</p>
        {onFeedback && !pending && !error ? (
          <PreviewFeedbackButtons feedback={feedback} onChange={onFeedback} />
        ) : null}
      </div>
    </div>
  );
}

function PreviewComposer({
  placeholder,
  accent,
  microphoneEnabled,
  voiceOnly = false,
  value,
  onChange,
  onSend,
  disabled = false,
  loading = false,
}: {
  placeholder: string;
  accent: ThemeAccent;
  microphoneEnabled: boolean;
  voiceOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 border-t px-3 py-2.5"
      style={{
        borderColor: "var(--luxia-border-subtle)",
        background: "var(--luxia-surface)",
      }}
    >
      <div
        className="flex min-w-0 flex-1 items-center rounded-full px-3.5 py-2"
        style={{ background: accent.primary }}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!disabled && !loading && value.trim()) onSend();
            }
          }}
          placeholder={voiceOnly ? "Type to test…" : placeholder}
          disabled={disabled || loading}
          aria-disabled={disabled || loading}
          aria-label={disabled ? "Message input disabled" : "Test message"}
          className="min-w-0 flex-1 border-0 bg-transparent outline-none luxia-type-body-dense placeholder:opacity-70 disabled:opacity-70"
          style={{ color: accent.onPrimary }}
        />
      </div>
      {(microphoneEnabled || voiceOnly) ? (
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full luxia-type-caption"
          style={{
            border: "1px solid var(--luxia-border-subtle)",
            color: "var(--luxia-text-secondary)",
            background: voiceOnly ? accent.primarySoft : "var(--luxia-surface-subtle)",
          }}
          aria-hidden
        >
          Mic
        </span>
      ) : null}
      {!voiceOnly ? (
        <button
          type="button"
          aria-label="Send test message"
          disabled={disabled || loading || !value.trim()}
          onClick={onSend}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full luxia-type-caption outline-none transition-opacity disabled:opacity-40"
          style={{ background: accent.primary, color: accent.onPrimary }}
        >
          →
        </button>
      ) : null}
    </div>
  );
}

function MobileMessageBubble({
  role,
  children,
  accent,
  bubbleSize,
  senderName,
  error = false,
  pending = false,
  feedback,
  onFeedback,
}: {
  role: "assistant" | "user";
  children: string;
  accent: ThemeAccent;
  bubbleSize: VidgetRecord["bubbleSize"];
  senderName: string;
  error?: boolean;
  pending?: boolean;
  feedback?: VidgetInboxFeedback;
  onFeedback?: (next: VidgetInboxFeedback) => void;
}) {
  const padY =
    bubbleSize === "lg" ? "py-2" : bubbleSize === "sm" ? "py-1.5" : "py-1.5";
  const isUser = role === "user";

  return (
    <div className={`flex px-1 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-[10px] px-2.5 ${padY}`}
        style={
          isUser
            ? { background: accent.primary, color: accent.onPrimary }
            : {
                background: error ? "var(--luxia-surface-subtle)" : "#fff",
                color: error ? "var(--luxia-text-secondary)" : "var(--luxia-text-primary)",
                border: `1px solid ${error ? "var(--luxia-border-default)" : "var(--luxia-border-subtle)"}`,
                opacity: pending ? 0.85 : 1,
              }
        }
      >
        <p
          className="mb-0.5 luxia-type-caption"
          style={{
            opacity: isUser ? 0.85 : 0.65,
            fontSize: "0.625rem",
          }}
        >
          {senderName}
        </p>
        <p
          className="luxia-type-body-dense whitespace-pre-wrap"
          style={{ fontSize: "0.75rem", lineHeight: 1.35 }}
        >
          {children}
        </p>
        {onFeedback && !pending && !error ? (
          <PreviewFeedbackButtons feedback={feedback} onChange={onFeedback} compact />
        ) : null}
      </div>
    </div>
  );
}

function MobileAvatarBand({
  avatar,
  accent,
}: {
  avatar: (typeof VIDGET_AVATARS)[number];
  accent: ThemeAccent;
}) {
  return (
    <div
      className="relative mx-2.5 mt-2 shrink-0 overflow-hidden rounded-[10px]"
      style={{
        height: "7.25rem",
        background: `linear-gradient(180deg, ${accent.primarySoft} 0%, rgba(15, 23, 42, 0.88) 100%)`,
        boxShadow: "0 4px 12px rgba(28, 19, 54, 0.12)",
      }}
      aria-hidden
    >
      <div className="flex h-full items-end justify-center pb-2">
        <span
          className="inline-flex h-16 w-16 items-center justify-center rounded-full text-white luxia-type-body-dense-strong"
          style={{
            background: avatar.color,
            boxShadow: "0 0 0 3px rgba(255,255,255,0.35)",
          }}
        >
          {avatar.name.replace("Avatar ", "A")}
        </span>
      </div>
    </div>
  );
}

function MobileComposer({
  placeholder,
  accent,
  microphoneEnabled,
  voiceOnly = false,
  value,
  onChange,
  onSend,
  disabled = false,
  loading = false,
}: {
  placeholder: string;
  accent: ThemeAccent;
  microphoneEnabled: boolean;
  voiceOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className="shrink-0 px-2.5 pb-2.5 pt-1"
      style={{ background: "var(--luxia-surface-subtle)" }}
    >
      <div
        className="flex items-center gap-1.5 rounded-full px-2 py-1.5"
        style={{ background: accent.primary }}
      >
        <span
          className="shrink-0 luxia-type-caption"
          style={{ color: accent.onPrimary, opacity: 0.85, fontSize: "0.625rem" }}
        >
          EN ▾
        </span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!disabled && !loading && value.trim()) onSend();
            }
          }}
          placeholder={voiceOnly ? "Type to test…" : placeholder}
          disabled={disabled || loading}
          aria-disabled={disabled || loading}
          aria-label={disabled ? "Message input disabled" : "Test message"}
          className="min-w-0 flex-1 border-0 bg-transparent outline-none luxia-type-body-dense placeholder:opacity-70 disabled:opacity-70"
          style={{ color: accent.onPrimary, fontSize: "0.75rem" }}
        />
        {(microphoneEnabled || voiceOnly) ? (
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full luxia-type-caption"
            style={{
              background: voiceOnly ? accent.onPrimary : "rgba(255,255,255,0.22)",
              color: voiceOnly ? accent.primary : accent.onPrimary,
              fontSize: "0.625rem",
            }}
            aria-hidden
          >
            Mic
          </span>
        ) : null}
        {!voiceOnly ? (
          <button
            type="button"
            aria-label="Send test message"
            disabled={disabled || loading || !value.trim()}
            onClick={onSend}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full luxia-type-caption outline-none disabled:opacity-40"
            style={{
              background: accent.onPrimary,
              color: accent.primary,
              fontSize: "0.625rem",
            }}
          >
            →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MobileChatConversation({
  record,
  accent,
  welcomeText,
  voiceOnly,
  assistantName,
  bg,
  testSession,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  welcomeText: string;
  voiceOnly: boolean;
  assistantName: string;
  bg: string;
  testSession: VidgetTestSession;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 py-2.5"
      style={{ background: bg }}
    >
      {voiceOnly && testSession.messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-2 text-center">
          <p
            className="luxia-type-body-dense-strong"
            style={{ color: "var(--luxia-text-primary)", fontSize: "0.8125rem" }}
          >
            Voice experience
          </p>
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)", fontSize: "0.75rem" }}
          >
            {welcomeText}
          </p>
        </div>
      ) : (
        <>
          <MobileMessageBubble
            role="assistant"
            accent={accent}
            bubbleSize={record.bubbleSize}
            senderName={assistantName}
          >
            {welcomeText}
          </MobileMessageBubble>
          <VisitorConversationBlock
            testSession={testSession}
            accent={accent}
            compact
          />
          {testSession.showTestHint ? (
            <p
              className="px-1 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)", fontSize: "0.625rem" }}
            >
              Ask a question to test this Vidget.
            </p>
          ) : null}
          <PreviewNewConversationButton
            visible={
              testSession.messages.length > 0
              || Boolean(testSession.selectedAssistantId)
            }
            onReset={testSession.reset}
          />
          {testSession.messages.map((message) => (
            <MobileMessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={message.role === "user" ? "User" : assistantName}
              error={message.role === "assistant-error"}
              feedback={message.feedback}
              onFeedback={
                message.role === "assistant"
                  ? (next) => testSession.setFeedback(message.id, next)
                  : undefined
              }
            >
              {message.content}
            </MobileMessageBubble>
          ))}
          {testSession.isLoading ? (
            <MobileMessageBubble
              role="assistant"
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={assistantName}
              pending
            >
              Thinking…
            </MobileMessageBubble>
          ) : null}
          <div ref={testSession.conversationEndRef} />
        </>
      )}
    </div>
  );
}

function MobileLandingPageHeader({
  record,
  accent,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-1.5 px-2.5 py-2"
      style={{ background: accent.primary }}
    >
      <div className="flex min-w-0 items-center">
        {record.companyLogoName || record.chatBubbleLogoName ? (
          <span
            className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-[3px] bg-white luxia-type-caption"
            style={{ color: accent.primary, fontSize: "0.5625rem" }}
          >
            Logo
          </span>
        ) : (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-white/95">
            <LuxiaStarLogo size={14} />
          </span>
        )}
      </div>
      <p
        className="min-w-0 flex-1 truncate text-center luxia-type-caption"
        style={{ color: accent.onPrimary, fontSize: "0.625rem" }}
      >
        Powered by Luxia
      </p>
      <PreviewDisplayToggle
        accent={accent}
        avatarFrameActive={avatarFrameActive}
        onSelectAvatarFrame={onSelectAvatarFrame}
        onSelectTextOnly={onSelectTextOnly}
        compact
      />
    </div>
  );
}

function MobileChannelFrame({
  record,
  accent,
  avatar,
  showAvatarFrame,
  voiceOnly,
  welcomeText,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
  testSession,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  avatar: (typeof VIDGET_AVATARS)[number];
  showAvatarFrame: boolean;
  voiceOnly: boolean;
  welcomeText: string;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
  testSession: VidgetTestSession;
}) {
  const assistantName = record.assistantName?.trim() || "Luxia Assistant";
  const bg = chatBackground(record, accent);
  const placeholder = record.tooltipText?.trim() || "Type here";
  const layout = frameLayout("mobile", false);
  const showComposer = !voiceOnly || record.microphoneEnabled;
  const composerDisabled = testSession.composerDisabled;
  const composerPlaceholder = testSession.needsAssistantSelection
    || testSession.noAssistantsAvailable
    ? "Choose an assistant to continue"
    : placeholder;

  return (
    <div
      className="mx-auto w-full shrink-0 rounded-[14px] p-1.5"
      style={{
        maxWidth: layout.maxWidth,
        background: "#334155",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.28)",
      }}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-[10px]"
        style={{
          height: layout.height,
          background: bg,
        }}
      >
        <MobileLandingPageHeader
          record={record}
          accent={accent}
          avatarFrameActive={avatarFrameActive}
          onSelectAvatarFrame={onSelectAvatarFrame}
          onSelectTextOnly={onSelectTextOnly}
        />

        {showAvatarFrame ? <MobileAvatarBand avatar={avatar} accent={accent} /> : null}

        <MobileChatConversation
          record={record}
          accent={accent}
          welcomeText={welcomeText}
          voiceOnly={voiceOnly}
          assistantName={assistantName}
          bg={bg}
          testSession={testSession}
        />

        {testSession.selectedAssistant ? (
          <ActiveAssistantIndicator
            name={testSession.selectedAssistant.name}
            compact
            hasConversation={testSession.messages.length > 0}
            onChangeAssistant={testSession.reset}
          />
        ) : null}

        {showComposer ? (
          <MobileComposer
            placeholder={composerPlaceholder}
            accent={accent}
            microphoneEnabled={record.microphoneEnabled}
            voiceOnly={voiceOnly}
            value={testSession.inputValue}
            onChange={testSession.setInputValue}
            onSend={testSession.send}
            disabled={composerDisabled}
            loading={testSession.isLoading}
          />
        ) : null}
      </div>
    </div>
  );
}

const TOTEM_KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
  [".?123", "space", "↵"],
] as const;

function TotemOnScreenKeyboard({ accent }: { accent: ThemeAccent }) {
  return (
    <div
      className="shrink-0 px-2 pb-2 pt-1"
      style={{ background: "#1e293b" }}
      aria-hidden
    >
      <div className="flex flex-col gap-1">
        {TOTEM_KEYBOARD_ROWS.map((row) => (
          <div key={row.join("-")} className="flex justify-center gap-0.5">
            {row.map((key) => {
              const isUtility =
                key === "⇧" || key === "⌫" || key === ".?123" || key === "↵";
              const isSpace = key === "space";
              return (
                <span
                  key={key}
                  className="inline-flex items-center justify-center rounded-[4px] luxia-type-caption"
                  style={{
                    height: "1.125rem",
                    minWidth: isSpace ? "5.5rem" : isUtility ? "1.35rem" : "1.05rem",
                    flex: isSpace ? 1 : undefined,
                    background: isUtility ? "#475569" : accent.primary,
                    color: isUtility ? "#e2e8f0" : accent.onPrimary,
                    fontSize: "0.5rem",
                  }}
                >
                  {isSpace ? "" : key}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TotemMessageBubble({
  role,
  children,
  accent,
  bubbleSize,
  senderName,
  error = false,
  pending = false,
  feedback,
  onFeedback,
}: {
  role: "assistant" | "user";
  children: string;
  accent: ThemeAccent;
  bubbleSize: VidgetRecord["bubbleSize"];
  senderName: string;
  error?: boolean;
  pending?: boolean;
  feedback?: VidgetInboxFeedback;
  onFeedback?: (next: VidgetInboxFeedback) => void;
}) {
  const padY =
    bubbleSize === "lg" ? "py-2" : bubbleSize === "sm" ? "py-1.5" : "py-1.5";
  const isUser = role === "user";

  return (
    <div className={`flex px-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-[10px] px-2.5 ${padY}`}
        style={
          isUser
            ? { background: accent.primary, color: accent.onPrimary }
            : {
                background: error ? "var(--luxia-surface-subtle)" : "#fff",
                color: error ? "var(--luxia-text-secondary)" : "var(--luxia-text-primary)",
                border: `1px solid ${error ? "var(--luxia-border-default)" : "var(--luxia-border-subtle)"}`,
                opacity: pending ? 0.85 : 1,
              }
        }
      >
        <p
          className="luxia-type-body-dense whitespace-pre-wrap"
          style={{ fontSize: "0.75rem", lineHeight: 1.35 }}
        >
          {children}
        </p>
        {onFeedback && !pending && !error ? (
          <PreviewFeedbackButtons feedback={feedback} onChange={onFeedback} compact />
        ) : null}
        <p
          className="mt-0.5 luxia-type-caption"
          style={{
            opacity: isUser ? 0.8 : 0.6,
            fontSize: "0.5625rem",
          }}
        >
          {senderName}, 3:54 PM
        </p>
      </div>
    </div>
  );
}

function TotemAvatarBand({
  avatar,
  accent,
  compact = false,
}: {
  avatar: (typeof VIDGET_AVATARS)[number];
  accent: ThemeAccent;
  compact?: boolean;
}) {
  return (
    <div
      className="relative mx-3 mt-2 shrink-0 overflow-hidden rounded-[10px]"
      style={{
        height: compact ? "6.5rem" : "10.5rem",
        background: `linear-gradient(180deg, ${accent.primarySoft} 0%, rgba(15, 23, 42, 0.82) 100%)`,
        boxShadow: "0 4px 14px rgba(28, 19, 54, 0.14)",
      }}
      aria-hidden
    >
      <div className="flex h-full items-end justify-center pb-3">
        <span
          className={`inline-flex items-center justify-center rounded-full text-white ${
            compact ? "h-14 w-14 luxia-type-body-dense-strong" : "h-[4.5rem] w-[4.5rem] luxia-type-title-section"
          }`}
          style={{
            background: avatar.color,
            boxShadow: "0 0 0 3px rgba(255,255,255,0.35)",
          }}
        >
          {avatar.name.replace("Avatar ", "A")}
        </span>
      </div>
    </div>
  );
}

function TotemComposer({
  placeholder,
  accent,
  microphoneEnabled,
  voiceOnly = false,
  value,
  onChange,
  onSend,
  disabled = false,
  loading = false,
}: {
  placeholder: string;
  accent: ThemeAccent;
  microphoneEnabled: boolean;
  voiceOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="relative shrink-0 px-3 pb-2 pt-1" style={{ background: "#fff" }}>
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-2"
        style={{ background: accent.primary }}
      >
        <span
          className="shrink-0 luxia-type-caption"
          style={{ color: accent.onPrimary, opacity: 0.85, fontSize: "0.625rem" }}
        >
          EN ▾
        </span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!disabled && !loading && value.trim()) onSend();
            }
          }}
          placeholder={voiceOnly ? "Type to test…" : placeholder}
          disabled={disabled || loading}
          aria-disabled={disabled || loading}
          aria-label={disabled ? "Message input disabled" : "Test message"}
          className="min-w-0 flex-1 border-0 bg-transparent outline-none luxia-type-body-dense placeholder:opacity-70 disabled:opacity-70"
          style={{ color: accent.onPrimary, fontSize: "0.8125rem" }}
        />
        {(microphoneEnabled || voiceOnly) ? (
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full luxia-type-caption"
            style={{
              background: voiceOnly ? accent.onPrimary : "rgba(255,255,255,0.22)",
              color: voiceOnly ? accent.primary : accent.onPrimary,
              fontSize: "0.625rem",
            }}
            aria-hidden
          >
            Mic
          </span>
        ) : null}
        {!voiceOnly ? (
          <button
            type="button"
            aria-label="Send test message"
            disabled={disabled || loading || !value.trim()}
            onClick={onSend}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full luxia-type-caption outline-none disabled:opacity-40"
            style={{
              background: accent.onPrimary,
              color: accent.primary,
              fontSize: "0.625rem",
            }}
          >
            →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TotemChatConversation({
  record,
  accent,
  welcomeText,
  voiceOnly,
  assistantName,
  bg,
  keyboardActive,
  testSession,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  welcomeText: string;
  voiceOnly: boolean;
  assistantName: string;
  bg: string;
  keyboardActive: boolean;
  testSession: VidgetTestSession;
}) {
  const statusCopy = keyboardActive
    ? "Processing your question…"
    : "Hmm… Let me think about that for a moment.";

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 py-2.5"
      style={{ background: bg }}
    >
      {voiceOnly && testSession.messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-2 text-center">
          <p
            className="luxia-type-body-dense-strong"
            style={{ color: "var(--luxia-text-primary)", fontSize: "0.875rem" }}
          >
            Voice experience
          </p>
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)", fontSize: "0.8125rem" }}
          >
            {welcomeText}
          </p>
        </div>
      ) : (
        <>
          <TotemMessageBubble
            role="assistant"
            accent={accent}
            bubbleSize={record.bubbleSize}
            senderName={assistantName}
          >
            {welcomeText}
          </TotemMessageBubble>
          <VisitorConversationBlock
            testSession={testSession}
            accent={accent}
            compact
          />
          {testSession.showTestHint ? (
            <p
              className="px-1.5 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)", fontSize: "0.625rem" }}
            >
              Ask a question to test this Vidget.
            </p>
          ) : null}
          <PreviewNewConversationButton
            visible={
              testSession.messages.length > 0
              || Boolean(testSession.selectedAssistantId)
            }
            onReset={testSession.reset}
          />
          {testSession.messages.map((message) => (
            <TotemMessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={message.role === "user" ? "User" : assistantName}
              error={message.role === "assistant-error"}
              feedback={message.feedback}
              onFeedback={
                message.role === "assistant"
                  ? (next) => testSession.setFeedback(message.id, next)
                  : undefined
              }
            >
              {message.content}
            </TotemMessageBubble>
          ))}
          {testSession.isLoading ? (
            <p
              className="px-1.5 italic luxia-type-caption"
              style={{ color: accent.primary, fontSize: "0.6875rem", opacity: 0.85 }}
            >
              {statusCopy}
            </p>
          ) : null}
          <div ref={testSession.conversationEndRef} />
        </>
      )}
    </div>
  );
}

function TotemLandingPageHeader({
  record,
  accent,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
  keyboardActive,
  onToggleKeyboard,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
  keyboardActive: boolean;
  onToggleKeyboard: () => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5"
      style={{ background: accent.primary }}
    >
      <div className="flex min-w-0 items-center">
        {record.companyLogoName || record.chatBubbleLogoName ? (
          <span
            className="inline-flex h-7 w-10 shrink-0 items-center justify-center rounded-[4px] bg-white luxia-type-caption"
            style={{ color: accent.primary, fontSize: "0.625rem" }}
          >
            Logo
          </span>
        ) : (
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-white/95">
            <LuxiaStarLogo size={16} />
          </span>
        )}
      </div>
      <p
        className="min-w-0 flex-1 truncate text-center luxia-type-caption"
        style={{ color: accent.onPrimary, fontSize: "0.6875rem" }}
      >
        Powered by Luxia
      </p>
      <PreviewDisplayToggle
        accent={accent}
        avatarFrameActive={avatarFrameActive}
        onSelectAvatarFrame={onSelectAvatarFrame}
        onSelectTextOnly={onSelectTextOnly}
        trailingControl={
          <button
            type="button"
            aria-label={keyboardActive ? "Hide keyboard preview" : "Show keyboard preview"}
            aria-pressed={keyboardActive}
            title={keyboardActive ? "Hide keyboard preview" : "Show keyboard preview"}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full luxia-type-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80"
            style={{
              background: keyboardActive ? accent.onPrimary : "rgba(255,255,255,0.5)",
              color: accent.primary,
              fontSize: "0.625rem",
            }}
            onClick={onToggleKeyboard}
          >
            K
          </button>
        }
      />
    </div>
  );
}

function TotemDeviceBase() {
  return (
    <div
      className="flex shrink-0 flex-col items-center gap-0.5 py-1.5"
      style={{ background: "#1e293b" }}
      aria-hidden
    >
      <span className="h-0.5 w-10 rounded-full bg-slate-500/70" />
      <span className="h-0.5 w-8 rounded-full bg-slate-600/60" />
    </div>
  );
}

function TotemChannelFrame({
  record,
  accent,
  avatar,
  showAvatarFrame,
  voiceOnly,
  welcomeText,
  keyboardActive,
  onToggleKeyboard,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
  testSession,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  avatar: (typeof VIDGET_AVATARS)[number];
  showAvatarFrame: boolean;
  voiceOnly: boolean;
  welcomeText: string;
  keyboardActive: boolean;
  onToggleKeyboard: () => void;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
  testSession: VidgetTestSession;
}) {
  const assistantName = record.assistantName?.trim() || "Luxia";
  const bg = chatBackground(record, accent);
  const placeholder = record.tooltipText?.trim() || "Type here";
  const layout = frameLayout("totem", false);
  const showComposer = !voiceOnly || record.microphoneEnabled;
  const avatarCompact = keyboardActive && showAvatarFrame;
  const composerDisabled = testSession.composerDisabled;
  const composerPlaceholder = testSession.needsAssistantSelection
    || testSession.noAssistantsAvailable
    ? "Choose an assistant to continue"
    : placeholder;

  return (
    <div
      className="mx-auto w-full shrink-0 rounded-[16px] p-2"
      style={{
        maxWidth: layout.maxWidth,
        background: "#1e293b",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.32)",
      }}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-[12px]"
        style={{
          height: layout.height,
          background: "#fff",
        }}
      >
        <TotemLandingPageHeader
          record={record}
          accent={accent}
          avatarFrameActive={avatarFrameActive}
          onSelectAvatarFrame={onSelectAvatarFrame}
          onSelectTextOnly={onSelectTextOnly}
          keyboardActive={keyboardActive}
          onToggleKeyboard={onToggleKeyboard}
        />

        {showAvatarFrame ? (
          <TotemAvatarBand avatar={avatar} accent={accent} compact={avatarCompact} />
        ) : null}

        <TotemChatConversation
          record={record}
          accent={accent}
          welcomeText={welcomeText}
          voiceOnly={voiceOnly}
          assistantName={assistantName}
          bg={bg}
          keyboardActive={keyboardActive}
          testSession={testSession}
        />

        {testSession.selectedAssistant ? (
          <ActiveAssistantIndicator
            name={testSession.selectedAssistant.name}
            compact
            hasConversation={testSession.messages.length > 0}
            onChangeAssistant={testSession.reset}
          />
        ) : null}

        {showComposer ? (
          <TotemComposer
            placeholder={composerPlaceholder}
            accent={accent}
            microphoneEnabled={record.microphoneEnabled}
            voiceOnly={voiceOnly}
            value={testSession.inputValue}
            onChange={testSession.setInputValue}
            onSend={testSession.send}
            disabled={composerDisabled}
            loading={testSession.isLoading}
          />
        ) : null}

        {keyboardActive ? <TotemOnScreenKeyboard accent={accent} /> : null}

        <TotemDeviceBase />
      </div>
    </div>
  );
}

function AvatarPanel({
  avatar,
  accent,
  variant = "split",
}: {
  avatar: (typeof VIDGET_AVATARS)[number];
  accent: ThemeAccent;
  variant?: "split" | "stacked" | "totem";
}) {
  const circleSize =
    variant === "totem"
      ? "h-28 w-28 luxia-type-title-section"
      : variant === "stacked"
        ? "h-20 w-20 luxia-type-body-dense-strong"
        : "h-24 w-24 luxia-type-title-section";

  return (
    <div
      className={
        variant === "split"
          ? "flex min-h-0 min-w-0 flex-1 items-center justify-center"
          : "flex items-center justify-center"
      }
      style={{
        background: variant === "split" ? accent.primarySoft : undefined,
        borderLeft: variant === "split" ? "1px solid var(--luxia-border-subtle)" : undefined,
      }}
    >
      <div className="flex flex-col items-center gap-2 px-3 py-2 text-center">
        <span
          className={`inline-flex items-center justify-center rounded-full text-white ${circleSize}`}
          style={{ background: avatar.color }}
          aria-hidden
        >
          {avatar.name.replace("Avatar ", "A")}
        </span>
        {variant === "split" ? (
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            Interactive avatar
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ChatConversation({
  record,
  accent,
  welcomeText,
  voiceOnly,
  assistantName,
  bg,
  testSession,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  welcomeText: string;
  voiceOnly: boolean;
  assistantName: string;
  bg: string;
  testSession: VidgetTestSession;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3"
      style={{ background: bg }}
    >
      {voiceOnly && testSession.messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2 text-center">
          <p
            className="luxia-type-body-dense-strong"
            style={{ color: "var(--luxia-text-primary)" }}
          >
            Voice experience
          </p>
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            {welcomeText}
          </p>
        </div>
      ) : (
        <>
          <MessageBubble
            role="assistant"
            accent={accent}
            bubbleSize={record.bubbleSize}
            senderName={assistantName}
          >
            {welcomeText}
          </MessageBubble>
          <VisitorConversationBlock
            testSession={testSession}
            accent={accent}
          />
          {testSession.showTestHint ? (
            <p
              className="px-1 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Ask a question to test this Vidget.
            </p>
          ) : null}
          <PreviewNewConversationButton
            visible={
              testSession.messages.length > 0
              || Boolean(testSession.selectedAssistantId)
            }
            onReset={testSession.reset}
          />
          {testSession.messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={message.role === "user" ? "User" : assistantName}
              error={message.role === "assistant-error"}
              feedback={message.feedback}
              onFeedback={
                message.role === "assistant"
                  ? (next) => testSession.setFeedback(message.id, next)
                  : undefined
              }
            >
              {message.content}
            </MessageBubble>
          ))}
          {testSession.isLoading ? (
            <MessageBubble
              role="assistant"
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={assistantName}
              pending
            >
              Thinking…
            </MessageBubble>
          ) : null}
          <div ref={testSession.conversationEndRef} />
        </>
      )}
    </div>
  );
}

function WebChannelFrame({
  record,
  accent,
  avatar,
  showAvatarFrame,
  voiceOnly,
  welcomeText,
  avatarFrameActive,
  onSelectAvatarFrame,
  onSelectTextOnly,
  testSession,
}: {
  record: VidgetRecord;
  accent: ThemeAccent;
  avatar: (typeof VIDGET_AVATARS)[number];
  showAvatarFrame: boolean;
  voiceOnly: boolean;
  welcomeText: string;
  avatarFrameActive: boolean;
  onSelectAvatarFrame: () => void;
  onSelectTextOnly: () => void;
  testSession: VidgetTestSession;
}) {
  const assistantName = record.assistantName?.trim() || "Luxia Assistant";
  const bg = chatBackground(record, accent);
  const placeholder = record.tooltipText?.trim() || "Type your message…";
  const webSplit = showAvatarFrame;
  const layout = frameLayout("desktop", webSplit);
  const showComposer = !voiceOnly;
  const composerDisabled = testSession.composerDisabled;
  const composerPlaceholder = testSession.needsAssistantSelection
    || testSession.noAssistantsAvailable
    ? "Choose an assistant to continue"
    : placeholder;
  const composerProps = {
    placeholder: composerPlaceholder,
    accent,
    microphoneEnabled: record.microphoneEnabled,
    voiceOnly,
    value: testSession.inputValue,
    onChange: testSession.setInputValue,
    onSend: testSession.send,
    disabled: composerDisabled,
    loading: testSession.isLoading,
  };
  const activeAssistantBar = testSession.selectedAssistant ? (
    <ActiveAssistantIndicator
      name={testSession.selectedAssistant.name}
      hasConversation={testSession.messages.length > 0}
      onChangeAssistant={testSession.reset}
    />
  ) : null;

  return (
    <div
      className="mx-auto flex w-full flex-col overflow-hidden rounded-[var(--luxia-radius-12)]"
      style={{
        maxWidth: layout.maxWidth,
        height: layout.height,
        border: "1px solid var(--luxia-border-subtle)",
        background: "#fff",
        boxShadow: "0 8px 24px rgba(28, 19, 54, 0.08)",
      }}
    >
      <LandingPageHeader
        record={record}
        accent={accent}
        avatarFrameActive={avatarFrameActive}
        onSelectAvatarFrame={onSelectAvatarFrame}
        onSelectTextOnly={onSelectTextOnly}
      />

      {webSplit ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-[0_0_46%] flex-col border-r border-[var(--luxia-border-subtle)]">
            <ChatConversation
              record={record}
              accent={accent}
              welcomeText={welcomeText}
              voiceOnly={voiceOnly}
              assistantName={assistantName}
              bg={bg}
              testSession={testSession}
            />
            {activeAssistantBar}
            {showComposer ? (
              <PreviewComposer {...composerProps} />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-[0_0_54%] flex-col">
            <AvatarPanel avatar={avatar} accent={accent} variant="split" />
          </div>
        </div>
      ) : (
        <>
          <ChatConversation
            record={record}
            accent={accent}
            welcomeText={welcomeText}
            voiceOnly={voiceOnly}
            assistantName={assistantName}
            bg={bg}
            testSession={testSession}
          />
          {activeAssistantBar}
          {showComposer ? (
            <PreviewComposer {...composerProps} />
          ) : voiceOnly && record.microphoneEnabled ? (
            <PreviewComposer {...composerProps} voiceOnly />
          ) : null}
        </>
      )}
    </div>
  );
}

export function VidgetLivePreview({
  record,
  device = "desktop",
  onDeviceChange,
  previewResetKey,
  galaxyName = "",
  constellationName = null,
  galaxyScopeSummary: _galaxyScopeSummary,
  sourceUnavailable = false,
  testContext,
}: {
  record: VidgetRecord;
  device?: VidgetPreviewDevice;
  onDeviceChange?: (device: VidgetPreviewDevice) => void;
  previewResetKey?: number;
  galaxyName?: string;
  constellationName?: string | null;
  galaxyScopeSummary?: string | null;
  sourceUnavailable?: boolean;
  testContext?: VidgetTestContextInput;
}) {
  const avatar = VIDGET_AVATARS.find((item) => item.id === record.avatarId)
    ?? VIDGET_AVATARS[0]!;
  const theme = VIDGET_THEMES.find((item) => item.id === record.themeId)
    ?? VIDGET_THEMES[0]!;
  const accent = THEME_ACCENTS[theme.id] ?? THEME_ACCENTS["theme-default"]!;
  const voiceOnly = record.experienceMode === "voice-only";
  const welcomeText =
    record.welcomeMessage?.trim() || "Hello! How can I help you today?";
  const [previewDisplayOverride, setPreviewDisplayOverride] = useState<
    PreviewDisplayMode | null
  >(null);
  const [totemKeyboardActive, setTotemKeyboardActive] = useState(false);

  const resolvedTestContext = useMemo<VidgetTestContextInput>(
    () =>
      testContext ?? {
        sourceAvailable: !sourceUnavailable,
        constellationOptions: [],
        galaxyName,
        constellationName,
      },
    [testContext, sourceUnavailable, galaxyName, constellationName],
  );

  const testSession = useVidgetTestSession(record, resolvedTestContext, previewResetKey);

  const previewDisplay =
    previewDisplayOverride ?? previewDisplayFromExperience(record.experienceMode);
  const showAvatarFrame = previewDisplay === "avatar-frame";

  const selectAvatarFramePreview = () => setPreviewDisplayOverride("avatar-frame");
  const selectTextOnlyPreview = () => setPreviewDisplayOverride("text-only");

  useEffect(() => {
    setPreviewDisplayOverride(null);
  }, [record.id, previewResetKey]);

  useEffect(() => {
    if (device !== "totem") {
      setTotemKeyboardActive(false);
    }
  }, [device]);

  if (record.channel === "whatsapp") {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <p
          className="text-center luxia-type-overline-data"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          Live preview
        </p>
        <SoftChannelPlaceholder
          channelLabel="WhatsApp"
          title="Configure the WhatsApp connection to preview this channel."
          detail="This connection is not configured."
        />
      </div>
    );
  }

  if (record.channel === "voip") {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <p
          className="text-center luxia-type-overline-data"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          Live preview
        </p>
        <SoftChannelPlaceholder
          channelLabel="VoIP"
          title="Configure the voice connection to preview this channel."
          detail="Voice channel is not configured."
        />
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 flex-col items-center ${
        device === "mobile" || device === "totem" ? "gap-3" : "gap-4"
      }`}
    >
      <div className="flex w-full min-w-0 max-w-[36rem] flex-col items-center gap-1.5">
        <p
          className="luxia-type-overline-data"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          Live preview
        </p>
        <p
          className="text-center luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          Test your Vidget here. Ask a question to check how it responds using its configured knowledge.
        </p>
      </div>

      <div className="w-full min-w-0 max-w-[36rem]">
        <PreviewModeTabs device={device} onDeviceChange={onDeviceChange} />
      </div>

      {sourceUnavailable || testSession.testBlockedReason ? (
        <p
          className="text-center luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
          role="status"
        >
          {sourceUnavailable
            ? "Source unavailable. This Vidget cannot be tested until its source is available."
            : testSession.testBlockedReason}
        </p>
      ) : null}

      {device === "mobile" ? (
        <MobileChannelFrame
          record={record}
          accent={accent}
          avatar={avatar}
          showAvatarFrame={showAvatarFrame}
          voiceOnly={voiceOnly}
          welcomeText={welcomeText}
          avatarFrameActive={showAvatarFrame}
          onSelectAvatarFrame={selectAvatarFramePreview}
          onSelectTextOnly={selectTextOnlyPreview}
          testSession={testSession}
        />
      ) : device === "totem" ? (
        <TotemChannelFrame
          record={record}
          accent={accent}
          avatar={avatar}
          showAvatarFrame={showAvatarFrame}
          voiceOnly={voiceOnly}
          welcomeText={welcomeText}
          keyboardActive={totemKeyboardActive}
          onToggleKeyboard={() => setTotemKeyboardActive((value) => !value)}
          avatarFrameActive={showAvatarFrame}
          onSelectAvatarFrame={selectAvatarFramePreview}
          onSelectTextOnly={selectTextOnlyPreview}
          testSession={testSession}
        />
      ) : (
        <WebChannelFrame
          record={record}
          accent={accent}
          avatar={avatar}
          showAvatarFrame={showAvatarFrame}
          voiceOnly={voiceOnly}
          welcomeText={welcomeText}
          avatarFrameActive={showAvatarFrame}
          onSelectAvatarFrame={selectAvatarFramePreview}
          onSelectTextOnly={selectTextOnlyPreview}
          testSession={testSession}
        />
      )}
    </div>
  );
}
