import { useMemo } from "react";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { getProjectNameById, HOME_PROJECTS } from "@/app/features/project/data";
import { getVidgetById } from "@/app/features/vidgets/data";
import { InboxConversationThread } from "./InboxConversationThread";
import { getVidgetInboxSessionById } from "./fixture";
import {
  formatShareExpiryLabel,
  resolveVidgetInboxShareAccess,
  sessionsForReviewShare,
} from "./share";
import type { VidgetInboxSession } from "./types";

export type SharedReviewPageProps = {
  shareId: string;
};

function SharedReviewState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-16 text-center"
      role="status"
    >
      <h1
        className="luxia-type-title-page"
        style={{ color: "var(--luxia-brand-primary)" }}
      >
        {title}
      </h1>
      <p
        className="mt-3 luxia-type-body-dense"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {body}
      </p>
    </div>
  );
}

function SharedSessionBlock({
  session,
  index,
  total,
  anonymous,
  projectName,
  vidgetName,
}: {
  session: VidgetInboxSession;
  index: number;
  total: number;
  anonymous: boolean;
  projectName: string;
  vidgetName: string | null;
}) {
  const title = anonymous
    ? total > 1
      ? `Conversation ${index + 1}`
      : "Conversation"
    : vidgetName
      ? `${vidgetName}`
      : "Conversation";

  return (
    <section
      className="min-w-0 overflow-hidden rounded-[14px] border"
      style={{
        borderColor: "var(--luxia-border-default)",
        background: "var(--luxia-surface, #fff)",
      }}
    >
      <header
        className="border-b px-4 py-3 sm:px-5"
        style={{ borderColor: "var(--luxia-border-subtle)" }}
      >
        <h2
          className="luxia-type-title-card"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {title}
        </h2>
        {!anonymous && total > 1 ? (
          <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            Conversation {index + 1} of {total}
          </p>
        ) : null}
      </header>
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <InboxConversationThread
          session={session}
          projectName={projectName}
          sourceType={null}
          constellationNameById={{}}
          readOnly
          anonymous={anonymous}
        />
      </div>
    </section>
  );
}

export function SharedReviewPage({ shareId }: SharedReviewPageProps) {
  const access = useMemo(
    () => resolveVidgetInboxShareAccess(shareId),
    [shareId],
  );

  const sessions = useMemo(() => {
    if (access.status !== "active") return [];
    return sessionsForReviewShare(access.share, getVidgetInboxSessionById);
  }, [access]);

  const share = access.status === "not-found" ? null : access.share;
  const anonymous = Boolean(share?.anonymous);
  const projectName = share
    ? getProjectNameById(share.projectId, HOME_PROJECTS, "Project")
    : "Project";

  const title = useMemo(() => {
    if (!share) return "Shared review";
    if (anonymous) return "Shared review";
    if (share.vidgetId) {
      const vidget = getVidgetById(share.vidgetId);
      if (vidget?.name) return vidget.name;
    }
    if (share.scopeType === "conversation") return "Shared conversation";
    if (share.scopeType === "selected") return "Shared conversations";
    return "Shared review";
  }, [share, anonymous]);

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: "linear-gradient(180deg, #F7F5FB 0%, #FAFDFF 42%, #FAFDFF 100%)" }}
    >
      <header
        className="shrink-0 border-b px-4 py-4 sm:px-6"
        style={{
          borderColor: "color-mix(in srgb, var(--luxia-brand-primary) 12%, transparent)",
          background: "color-mix(in srgb, white 88%, var(--luxia-opacity-brand-primary-08))",
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <LuxiaStarLogo size={28} />
          <div className="min-w-0">
            <p
              className="luxia-type-overline-data"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              Luxia
            </p>
            <h1
              className="truncate text-[1.05rem] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--luxia-brand-primary)" }}
            >
              Shared review
            </h1>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">
          {access.status === "not-found" ? (
            <SharedReviewState
              title="Review not found"
              body="This review link is invalid or no longer exists."
            />
          ) : access.status === "expired" ? (
            <SharedReviewState
              title="This review link has expired."
              body="Ask the reviewer for a new link if you still need access."
            />
          ) : access.status === "revoked" ? (
            <SharedReviewState
              title="This review link is no longer available."
              body="The reviewer revoked access to this shared review."
            />
          ) : sessions.length === 0 ? (
            <SharedReviewState
              title="No review content is available."
              body="This shared review does not include any conversations."
            />
          ) : (
            <div className="space-y-5">
              <div className="min-w-0">
                <h2
                  className="luxia-type-title-section"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {title}
                </h2>
                <p
                  className="mt-1.5 luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  Read-only
                  {share
                    ? ` · ${formatShareExpiryLabel(share.expiresAt)}`
                    : ""}
                  {anonymous ? " · Identifying details hidden" : ""}
                </p>
              </div>

              <div className="space-y-4">
                {sessions.map((session, index) => {
                  const vidget = getVidgetById(session.vidgetId);
                  return (
                    <SharedSessionBlock
                      key={session.id}
                      session={session}
                      index={index}
                      total={sessions.length}
                      anonymous={anonymous}
                      projectName={anonymous ? "Shared review" : projectName}
                      vidgetName={anonymous ? null : vidget?.name ?? null}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer
        className="shrink-0 border-t px-4 py-4 text-center sm:px-6"
        style={{ borderColor: "var(--luxia-border-subtle)" }}
      >
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Shared via Luxia
        </p>
      </footer>
    </div>
  );
}
