import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
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
  canSend: boolean;
  testBlockedReason?: string;
  showTestHint: boolean;
  conversationEndRef: React.MutableRefObject<HTMLDivElement | null>;
};

function useVidgetTestSession(
  record: VidgetRecord,
  testContext: VidgetTestContextInput,
  previewResetKey: number | undefined,
): VidgetTestSession {
  const [messages, setMessages] = useState<VidgetTestMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const eligibility = useMemo(
    () => resolveVidgetTestEligibility(record, testContext),
    [record, testContext],
  );

  useEffect(() => {
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
  }, [record.id, previewResetKey]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isLoading]);

  const send = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading || !eligibility.canTest) return;

    const userMessage: VidgetTestMessage = {
      id: nextVidgetTestMessageId(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    void requestVidgetTestResponse({
      record,
      userMessage: trimmed,
      context: testContext,
    })
      .then((result) => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextVidgetTestMessageId(),
            role: result.ok ? "assistant" : "assistant-error",
            content: result.ok ? result.content : result.error,
          },
        ]);
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextVidgetTestMessageId(),
            role: "assistant-error",
            content: "Something went wrong while testing this Vidget. Try again.",
          },
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [eligibility.canTest, inputValue, isLoading, record, testContext]);

  const canSend = eligibility.canTest && !isLoading && inputValue.trim().length > 0;
  const showTestHint =
    eligibility.canTest && messages.length === 0 && !isLoading;

  return {
    messages,
    isLoading,
    inputValue,
    setInputValue,
    send,
    canSend,
    testBlockedReason: eligibility.canTest ? undefined : eligibility.reason,
    showTestHint,
    conversationEndRef,
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

function MessageBubble({
  role,
  children,
  accent,
  bubbleSize,
  senderName,
  error = false,
  pending = false,
}: {
  role: "assistant" | "user";
  children: string;
  accent: ThemeAccent;
  bubbleSize: VidgetRecord["bubbleSize"];
  senderName: string;
  error?: boolean;
  pending?: boolean;
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
          aria-label="Test message"
          className="min-w-0 flex-1 border-0 bg-transparent outline-none luxia-type-body-dense placeholder:opacity-70"
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
}: {
  role: "assistant" | "user";
  children: string;
  accent: ThemeAccent;
  bubbleSize: VidgetRecord["bubbleSize"];
  senderName: string;
  error?: boolean;
  pending?: boolean;
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
          aria-label="Test message"
          className="min-w-0 flex-1 border-0 bg-transparent outline-none luxia-type-body-dense placeholder:opacity-70"
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
          {testSession.showTestHint ? (
            <p
              className="px-1 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)", fontSize: "0.625rem" }}
            >
              Ask a question to test this Vidget.
            </p>
          ) : null}
          {testSession.messages.map((message) => (
            <MobileMessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={message.role === "user" ? "User" : assistantName}
              error={message.role === "assistant-error"}
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
  const composerDisabled = Boolean(testSession.testBlockedReason);

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

        {showComposer ? (
          <MobileComposer
            placeholder={placeholder}
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
}: {
  role: "assistant" | "user";
  children: string;
  accent: ThemeAccent;
  bubbleSize: VidgetRecord["bubbleSize"];
  senderName: string;
  error?: boolean;
  pending?: boolean;
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
          aria-label="Test message"
          className="min-w-0 flex-1 border-0 bg-transparent outline-none luxia-type-body-dense placeholder:opacity-70"
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
          {testSession.showTestHint ? (
            <p
              className="px-1.5 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)", fontSize: "0.625rem" }}
            >
              Ask a question to test this Vidget.
            </p>
          ) : null}
          {testSession.messages.map((message) => (
            <TotemMessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={message.role === "user" ? "User" : assistantName}
              error={message.role === "assistant-error"}
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
  const composerDisabled = Boolean(testSession.testBlockedReason);

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

        {showComposer ? (
          <TotemComposer
            placeholder={placeholder}
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
          {testSession.showTestHint ? (
            <p
              className="px-1 text-center luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Ask a question to test this Vidget.
            </p>
          ) : null}
          {testSession.messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              accent={accent}
              bubbleSize={record.bubbleSize}
              senderName={message.role === "user" ? "User" : assistantName}
              error={message.role === "assistant-error"}
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
  const composerDisabled = Boolean(testSession.testBlockedReason);
  const composerProps = {
    placeholder,
    accent,
    microphoneEnabled: record.microphoneEnabled,
    voiceOnly,
    value: testSession.inputValue,
    onChange: testSession.setInputValue,
    onSend: testSession.send,
    disabled: composerDisabled,
    loading: testSession.isLoading,
  };

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
          detail="Connection is not configured in this prototype."
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
          detail="Voice channel is not configured in this prototype."
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
