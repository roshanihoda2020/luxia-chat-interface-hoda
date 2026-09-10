import type { ReactNode } from "react";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { LuxiaResponseCard } from "@/app/features/chat/LuxiaResponseCard";
import type { GalaxyRoutingMeta } from "@/app/features/galaxy/constants";
import { LX } from "@/app/features/active-data-tables/tokens";
import type { VidgetSourceType } from "@/app/features/vidgets/types";
import {
  buildInteractionCopyText,
  groupInboxInteractions,
  resolveRefineConstellationId,
  type VidgetInboxInteraction,
} from "./interactions";
import { assistantTurnIsProblematic } from "./problems";
import type {
  VidgetInboxAssistantTurn,
  VidgetInboxFeedback,
  VidgetInboxRefinePayload,
  VidgetInboxSession,
} from "./types";

function galaxyTypeLabel(value: string | undefined): "PDF" | "CSV" | "DB" {
  if (value === "pdf" || value === "PDF") return "PDF";
  if (value === "csv" || value === "CSV") return "CSV";
  return "DB";
}

function feedbackLabel(feedback: VidgetInboxFeedback): string {
  if (feedback === "positive") return "Positive feedback";
  if (feedback === "negative") return "Negative feedback";
  return "No feedback";
}

function InteractionActions({
  interaction,
  refineConstellationId,
  onRefine,
}: {
  interaction: VidgetInboxInteraction;
  refineConstellationId: string | null;
  onRefine?: (payload: Omit<VidgetInboxRefinePayload, "projectId">) => void;
}) {
  const assistant = interaction.assistant;

  async function handleCopy() {
    const text = buildInteractionCopyText(interaction);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3 pt-1"
      style={{ borderTop: "1px solid var(--luxia-border-subtle)" }}
    >
      {assistant ? (
        <span
          className="inline-flex items-center gap-1.5 luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          <ThumbsUp
            size={13}
            strokeWidth={1.8}
            aria-hidden
            fill={assistant.feedback === "positive" ? "currentColor" : "none"}
            style={{
              color: assistant.feedback === "positive"
                ? "var(--luxia-brand-primary)"
                : "var(--luxia-text-muted)",
            }}
          />
          <ThumbsDown
            size={13}
            strokeWidth={1.8}
            aria-hidden
            fill={assistant.feedback === "negative" ? "currentColor" : "none"}
            style={{
              color: assistant.feedback === "negative"
                ? "var(--luxia-warning-90)"
                : "var(--luxia-text-muted)",
            }}
          />
          {feedbackLabel(assistant.feedback)}
        </span>
      ) : null}
      <button
        type="button"
        className="inline-flex h-7 items-center gap-1.5 rounded-[var(--luxia-radius-8)] px-2 luxia-type-caption outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
        style={{ color: "var(--luxia-text-muted)" }}
        onClick={() => void handleCopy()}
      >
        <Copy size={13} strokeWidth={1.8} aria-hidden />
        Copy
      </button>
      {assistant && refineConstellationId && onRefine ? (
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-[var(--luxia-radius-8)] px-2 luxia-type-caption outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{ color: "var(--luxia-text-muted)" }}
          onClick={() =>
            onRefine({
              constellationId: refineConstellationId,
              question: interaction.visitor?.content ?? "",
              answer: assistant.content,
              presentation: assistant.presentation,
              notice: assistant.notice,
              sources: assistant.sources,
              feedback: assistant.feedback,
            })
          }
        >
          Refine in chat
        </button>
      ) : null}
    </div>
  );
}

function VisitorTurn({ turn }: { turn: NonNullable<VidgetInboxInteraction["visitor"]> }) {
  return (
    <div className="flex justify-end min-w-0 max-w-full">
      <div className="min-w-0 max-w-[min(70%,720px)]">
        <div
          className="luxia-chat-text px-5 py-3.5 luxia-type-body-small-strong"
          style={{
            background: "var(--luxia-purple-70)",
            color: "var(--luxia-text-inverse)",
            borderRadius: "18px 18px 6px 18px",
          }}
        >
          {turn.content}
        </div>
        <p
          className="text-right luxia-type-caption mt-1.5 pr-1"
          style={{ color: LX.borderStrong }}
        >
          {turn.timestamp}
        </p>
      </div>
    </div>
  );
}

function AssistantTurn({
  turn,
  projectName,
  sourceType,
  constellationName,
  constellationType,
  footer,
}: {
  turn: VidgetInboxAssistantTurn;
  projectName: string;
  sourceType: VidgetSourceType | null;
  constellationName: string | null;
  constellationType?: string;
  footer: ReactNode;
}) {
  const galaxy: GalaxyRoutingMeta | undefined =
    sourceType === "galaxy" && turn.constellationId && constellationName
      ? {
          projectName,
          phase: "complete",
          matched: {
            id: turn.constellationId,
            label: constellationName,
            type: galaxyTypeLabel(constellationType),
          },
          selectionSource: "auto",
          constellationsChecked: 1,
        }
      : undefined;

  return (
    <LuxiaResponseCard
      content={turn.content}
      timestamp={turn.timestamp}
      presentation={turn.presentation}
      notice={turn.notice}
      sources={turn.sources}
      galaxy={galaxy}
      compact
      footer={footer}
    />
  );
}

export function InboxConversationThread({
  session,
  projectName,
  sourceType,
  vidgetConstellationId,
  constellationNameById,
  constellationTypeById,
  onRefine,
}: {
  session: VidgetInboxSession;
  projectName: string;
  sourceType: VidgetSourceType | null;
  vidgetConstellationId?: string | null;
  constellationNameById: Record<string, string>;
  constellationTypeById?: Record<string, string>;
  onRefine?: (payload: Omit<VidgetInboxRefinePayload, "projectId">) => void;
}) {
  const interactions = groupInboxInteractions(session.turns);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {interactions.map((interaction) => {
        const assistant = interaction.assistant;
        const constellationId = assistant?.constellationId ?? null;
        const constellationName = constellationId
          ? constellationNameById[constellationId] ?? null
          : null;
        const refineConstellationId = assistant
          ? resolveRefineConstellationId({
              vidgetSourceType: sourceType,
              vidgetConstellationId,
              interactionConstellationId: assistant.constellationId,
            })
          : null;

        return (
          <article key={interaction.id} className="min-w-0 space-y-3">
            {interaction.visitor ? <VisitorTurn turn={interaction.visitor} /> : null}
            {assistant ? (
              <div className="min-w-0">
                <AssistantTurn
                  turn={assistant}
                  projectName={projectName}
                  sourceType={sourceType}
                  constellationName={constellationName}
                  constellationType={
                    constellationId
                      ? constellationTypeById?.[constellationId]
                      : undefined
                  }
                  footer={
                    <InteractionActions
                      interaction={interaction}
                      refineConstellationId={refineConstellationId}
                      onRefine={onRefine}
                    />
                  }
                />
                {assistantTurnIsProblematic(assistant) ? (
                  <span className="sr-only">Problematic interaction</span>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
