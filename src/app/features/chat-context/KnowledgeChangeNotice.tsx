import { LuxiaConstellationIcon, LuxiaGalaxyIcon } from "@/assets/icons";

/**
 * Transient in-conversation notice after the chat's knowledge changes (Composer or Inspector).
 * UI-only: never part of the message history, never sent to the AI.
 */
export type KnowledgeNotice = {
  chatId: string;
  /** new-chat: a populated chat was kept and a new one started · in-place: empty chat changed ·
   *  to-galaxy: now in the Project's Galaxy chat · from-galaxy: new Constellation chat, Galaxy kept. */
  kind: "new-chat" | "in-place" | "to-galaxy" | "from-galaxy";
  label: string;
  previousLabel?: string;
  /** Home: the next message starts the new chat (none exists yet), so never claim it was created. */
  pending?: boolean;
};

export function KnowledgeChangeNotice({ notice }: { notice: KnowledgeNotice }) {
  const galaxy = notice.kind === "to-galaxy";
  const title = galaxy ? "Now using Galaxy" : "Constellation changed";
  const created = notice.pending ? "" : "A new chat was created. ";
  const detail = notice.kind === "new-chat"
    ? <>{created}&ldquo;{notice.previousLabel}&rdquo; keeps its messages.</>
    : notice.kind === "from-galaxy"
      ? <>{created}Galaxy keeps its conversation.</>
      : null;
  return (
    <div className="flex justify-center px-2 py-3" data-luxia-knowledge-notice={notice.kind}>
      <div
        role="status"
        className="flex max-w-[min(520px,100%)] items-start gap-2.5 rounded-[12px] border px-3.5 py-2.5"
        style={{
          borderColor: "var(--luxia-opacity-brand-secondary-16, rgba(107,79,187,0.16))",
          background: "var(--luxia-opacity-brand-secondary-04)",
          color: "var(--luxia-text-secondary)",
        }}
      >
        <span className="mt-0.5 flex shrink-0" style={{ color: "var(--luxia-purple-60)" }} aria-hidden>
          {galaxy ? <LuxiaGalaxyIcon size={15} color="currentColor" /> : <LuxiaConstellationIcon size={15} color="currentColor" />}
        </span>
        <p className="min-w-0 text-[12.5px] leading-[18px]" style={{ overflowWrap: "anywhere" }}>
          <span className="font-semibold" style={{ color: "var(--luxia-purple-70)" }}>{title}</span>
          <span aria-hidden> · </span>
          {galaxy
            ? <>Answers now come from this Project&rsquo;s Constellations.</>
            : <>You&rsquo;re now chatting with <span className="font-semibold" style={{ color: "var(--luxia-text-primary)" }}>{notice.label}</span>.</>}
          {detail ? <> {detail}</> : null}
        </p>
      </div>
    </div>
  );
}
