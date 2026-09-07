import { useState, type ReactNode } from "react";
import { Ban, ChevronDown, CircleAlert, TriangleAlert } from "lucide-react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { LX } from "@/app/features/active-data-tables/tokens";
import { GalaxyProvenanceRow } from "@/app/features/galaxy/GalaxyProvenanceRow";
import type { GalaxyRoutingMeta } from "@/app/features/galaxy/constants";
import { renderChatContent } from "./renderChatContent";

export type LuxiaResponsePresentation = "normal" | "warning" | "error" | "block";

export type LuxiaResponseSource = { id: string; label: string };

export type LuxiaResponseInsights = {
  format: "bullets" | "paragraphs";
  items: string[];
};

const INSIGHTS_MIN_CONTENT_LENGTH = 220;

function shouldShowInsightsEligibleContent(content: string): boolean {
  const normalized = content.trim();
  if (!normalized) return false;

  const paragraphs = normalized.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  const bulletLines = normalized.split("\n").filter((line) => line.trim().startsWith("- "));
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);

  return (
    normalized.length >= INSIGHTS_MIN_CONTENT_LENGTH ||
    paragraphs.length >= 3 ||
    bulletLines.length >= 2 ||
    sentences.length >= 5
  );
}

function normalizeInsightText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function insightsRepeatAnswer(content: string, items: string[]): boolean {
  const normalizedContent = normalizeInsightText(content);
  const redundant = items.filter((item) => {
    const normalizedItem = normalizeInsightText(item);
    if (!normalizedItem) return true;
    if (normalizedContent.includes(normalizedItem)) return true;
    const words = normalizedItem.split(" ").filter(Boolean);
    if (words.length < 4) return normalizedContent.includes(normalizedItem);
    return normalizedContent.includes(words.slice(0, 6).join(" "));
  });
  return redundant.length >= Math.ceil(items.length * 0.67);
}

function getResponseInsights(
  content: string,
  insights?: LuxiaResponseInsights,
): LuxiaResponseInsights | null {
  if (!insights?.items?.length) return null;
  const items = insights.items.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (items.length === 0) return null;
  if (!shouldShowInsightsEligibleContent(content)) return null;
  if (insightsRepeatAnswer(content, items)) return null;
  return { format: insights.format, items };
}

function ResponseInsightsContent({ insights }: { insights: LuxiaResponseInsights }) {
  if (insights.format === "paragraphs") {
    return (
      <div className="mt-3 space-y-2 pl-1 min-w-0">
        {insights.items.map((item, index) => (
          <p key={index} className="luxia-chat-text luxia-type-metadata" style={{ color: LX.textSecondary }}>
            {item}
          </p>
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-3 space-y-1.5 pl-1 min-w-0">
      {insights.items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 luxia-type-metadata min-w-0" style={{ color: LX.textSecondary }}>
          <span
            className="mt-[6px] w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ background: LX.accent }}
          />
          <span className="luxia-chat-text min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SourceFooter({
  sources,
  insights,
}: {
  sources?: LuxiaResponseSource[];
  insights?: LuxiaResponseInsights;
}) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const hasInsights = Boolean(insights?.items.length);
  const hasSources = Boolean(sources && sources.length > 0);
  const sectionOffset = hasSources ? "mt-3" : "";

  return (
    <div className="mt-4 pt-3.5 min-w-0" style={{ borderTop: `1px solid ${LX.borderSubtle}` }}>
      {hasSources ? (
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="luxia-type-metadata flex-shrink-0" style={{ color: LX.textMuted }}>Sources:</span>
          {sources!.map((source, index) => (
            <button
              key={source.id}
              type="button"
              className="luxia-chat-text luxia-type-metadata transition-colors outline-none text-left"
              style={{ color: LX.purple60 }}
              onMouseEnter={(event) => {
                (event.currentTarget as HTMLElement).style.color = LX.primary;
              }}
              onMouseLeave={(event) => {
                (event.currentTarget as HTMLElement).style.color = LX.purple60;
              }}
            >
              {source.label}{index < sources!.length - 1 ? "," : ""}
            </button>
          ))}
        </div>
      ) : null}

      {hasInsights && insights ? (
        <div className={sectionOffset}>
          <button
            type="button"
            onClick={() => setInsightsOpen((open) => !open)}
            aria-expanded={insightsOpen}
            className="flex items-center gap-1.5 luxia-type-caption hover:opacity-80 transition-opacity outline-none"
            style={{ color: LX.textMuted }}
          >
            <ChevronDown
              size={11}
              style={{
                transition: "transform 160ms ease",
                transform: insightsOpen ? "rotate(180deg)" : "none",
              }}
            />
            Insights
          </button>
          {insightsOpen ? <ResponseInsightsContent insights={insights} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ConfidenceNotice({
  presentation,
  notice,
  className = "mt-3",
}: {
  presentation: "warning" | "error" | "block";
  notice?: string | null;
  className?: string;
}) {
  const isWarning = presentation === "warning";
  const isBlock = presentation === "block";
  const Icon = isBlock ? Ban : presentation === "error" ? TriangleAlert : CircleAlert;
  const label = isWarning ? "Warning" : "Error";
  const tone = isWarning
    ? {
        background: "var(--luxia-opacity-warning-12)",
        border: "1px solid var(--luxia-opacity-warning-32)",
        color: "var(--luxia-warning-90)",
      }
    : isBlock
      ? {
          background: "var(--luxia-opacity-error-12)",
          border: "1px solid var(--luxia-opacity-error-32)",
          color: "var(--luxia-error-70)",
        }
      : {
          background: "var(--luxia-opacity-error-08)",
          border: "1px solid var(--luxia-opacity-error-24)",
          color: "var(--luxia-error-70)",
        };
  const message = isBlock ? notice?.trim() ?? "" : notice?.trim() || label;
  return (
    <div
      className={`${className} flex w-full items-start gap-2 rounded-[var(--luxia-radius-8)] px-3 py-2`}
      style={{
        background: tone.background,
        border: tone.border,
      }}
      role="status"
    >
      <Icon
        size={14}
        strokeWidth={1.8}
        className="mt-0.5 shrink-0"
        style={{ color: tone.color }}
        aria-hidden
      />
      {message ? (
        <p
          className="min-w-0 luxia-type-caption"
          style={{ color: tone.color }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function LuxiaResponseCard({
  content,
  timestamp,
  presentation = "normal",
  notice,
  sources,
  insights,
  galaxy,
  onOpenGalaxyConstellation,
  onViewGalaxyActivity,
  footer,
  compact = false,
}: {
  content: string;
  timestamp?: string;
  presentation?: LuxiaResponsePresentation;
  notice?: string | null;
  sources?: LuxiaResponseSource[];
  insights?: LuxiaResponseInsights;
  galaxy?: GalaxyRoutingMeta;
  onOpenGalaxyConstellation?: () => void;
  onViewGalaxyActivity?: () => void;
  footer?: ReactNode;
  compact?: boolean;
}) {
  const resolvedInsights = getResponseInsights(content, insights);
  const showAnswerBody = !galaxy || galaxy.phase === "answering" || galaxy.phase === "complete";
  const isBlock = presentation === "block";
  const showStandardFooter = !galaxy && !isBlock && (sources || resolvedInsights);

  return (
    <div className={`flex items-start gap-3 min-w-0 max-w-full ${compact ? "mb-0" : "mb-7"}`}>
      <div
        className="flex-shrink-0 w-8 flex items-start justify-center rounded-[8px]"
        style={{ background: "transparent" }}
      >
        <LuxiaStarLogo size={compact ? 20 : 24} />
      </div>
      <div className={`flex-1 min-w-0 ${compact ? "" : "max-w-[680px]"}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="luxia-type-body-dense font-bold" style={{ color: LX.primary }}>Luxia</span>
          {timestamp ? (
            <span className="luxia-type-caption" style={{ color: LX.borderStrong }}>{timestamp}</span>
          ) : null}
        </div>
        <div
          className="rounded-[16px] min-w-0 overflow-hidden"
          style={{
            background: "white",
            border: "1px solid #EAF0F6",
            boxShadow: compact ? "none" : "0 6px 18px rgba(15,23,42,0.08)",
          }}
        >
          <div className={`min-w-0 ${compact ? "px-4 py-3.5" : "px-5 py-4"}`}>
            {galaxy && galaxy.phase !== "complete" ? (
              <GalaxyProvenanceRow meta={galaxy} />
            ) : null}
            {isBlock ? (
              <ConfidenceNotice presentation="block" notice={content} className="" />
            ) : null}
            {showAnswerBody && content && !isBlock ? (
              <div className="luxia-chat-text" style={{ color: LX.primary }}>
                {renderChatContent(content)}
              </div>
            ) : null}
            {presentation === "warning" || presentation === "error" ? (
              <ConfidenceNotice presentation={presentation} notice={notice} />
            ) : null}
            {galaxy && galaxy.phase === "complete" ? (
              <GalaxyProvenanceRow
                meta={galaxy}
                onViewActivity={onViewGalaxyActivity}
                onOpenConstellation={onOpenGalaxyConstellation}
              />
            ) : null}
            {showStandardFooter ? (
              <SourceFooter
                sources={sources}
                insights={resolvedInsights ?? undefined}
              />
            ) : null}
          </div>
          {footer}
        </div>
      </div>
    </div>
  );
}
