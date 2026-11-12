import { useCallback, useMemo, useRef, useState } from "react";
import type { Chat, Constellation, Message } from "@/app/app-sections/appSectionShared";
import type { Scenario } from "./mockData";

export type Scope = { kind: "galaxy" } | { kind: "constellation"; id: string };

export interface ProposedModel {
  projectId: string;
  chats: Chat[];
  messages: Record<string, Message[]>;
  drafts: Record<string, string>;
  /** Chats whose scope hasn't been chosen yet (new chat, several Constellations, nothing remembered). */
  unscoped: Set<string>;
  hidden: Set<string>;
  activeChatId: string | null;
  notice: string | null;
  scopePickerFor: string | null;
}

function now() {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function usableConstellations(scenario: Scenario, projectId: string): Constellation[] {
  const restricted = new Set(scenario.restrictedConstellationIds ?? []);
  return scenario.constellations.filter((c) => c.projectId === projectId && !restricted.has(c.id));
}

export function scopeOf(chat: Chat): Scope {
  return chat.chatType === "galaxy" ? { kind: "galaxy" } : { kind: "constellation", id: chat.constellationId ?? "" };
}

export function scopeLabel(scope: Scope, constellations: Constellation[]): string {
  if (scope.kind === "galaxy") return "Galaxy";
  return constellations.find((c) => c.id === scope.id)?.label ?? "Constellation";
}

/**
 * In-memory model for the proposed C1/C2 behaviour. Nothing here touches the
 * real app's chats, storage or routes.
 */
export function useProposedModel(scenario: Scenario, initialProjectId?: string) {
  const counter = useRef(0);
  const remembered = useRef<Record<string, Scope>>({});
  const lastOpened = useRef<Record<string, string>>({});

  const initial = useMemo<ProposedModel>(() => {
    const projectId = initialProjectId ?? scenario.startProjectId;
    const first = scenario.chats.find((c) => c.projectId === projectId && c.chatType === "constellation")
      ?? scenario.chats.find((c) => c.projectId === projectId) ?? null;
    return {
      projectId,
      chats: scenario.chats.map((c) => ({ ...c })),
      messages: { ...scenario.messages },
      drafts: {},
      unscoped: new Set(),
      hidden: new Set(),
      activeChatId: first?.id ?? null,
      notice: null,
      scopePickerFor: null,
    };
  }, [scenario, initialProjectId]);

  const [m, setM] = useState<ProposedModel>(initial);

  const resolveScope = useCallback((projectId: string): Scope | null => {
    const usable = usableConstellations(scenario, projectId);
    const last = remembered.current[projectId];
    if (last && (last.kind === "galaxy" ? usable.length > 0 : usable.some((c) => c.id === last.id))) return last;
    if (usable.length === 1) return { kind: "constellation", id: usable[0].id };
    return null;
  }, [scenario]);

  const visibleChats = useCallback((state: ProposedModel, projectId: string) =>
    state.chats.filter((c) => c.projectId === projectId && !state.hidden.has(c.id)), []);

  const makeChat = (projectId: string, scope: Scope | null): Chat => {
    counter.current += 1;
    return {
      id: `ux-new-${counter.current}`,
      label: `New chat ${counter.current}`,
      chatType: scope?.kind === "galaxy" ? "galaxy" : "constellation",
      projectId,
      constellationId: scope?.kind === "constellation" ? scope.id : undefined,
    };
  };

  const selectProject = (projectId: string) => setM((s) => {
    if (s.activeChatId) {
      const active = s.chats.find((c) => c.id === s.activeChatId);
      if (active) lastOpened.current[active.projectId] = active.id;
    }
    const visible = visibleChats(s, projectId);
    const rememberedId = lastOpened.current[projectId];
    const next = visible.find((c) => c.id === rememberedId) ?? visible.find((c) => c.chatType === "constellation") ?? visible[0] ?? null;
    return { ...s, projectId, activeChatId: next?.id ?? null, notice: null, scopePickerFor: null };
  });

  const selectChat = (chatId: string) => setM((s) => ({ ...s, activeChatId: chatId, scopePickerFor: null }));

  /** New chat in the current Project; the question stays an unsent draft. */
  const newChat = (draft = "", projectId?: string) => setM((s) => {
    const pid = projectId ?? s.projectId;
    if (usableConstellations(scenario, pid).length === 0) return { ...s, projectId: pid, activeChatId: null };
    const scope = resolveScope(pid);
    const chat = makeChat(pid, scope);
    const unscoped = new Set(s.unscoped);
    if (!scope) unscoped.add(chat.id);
    return {
      ...s,
      projectId: pid,
      chats: [...s.chats, chat],
      messages: { ...s.messages, [chat.id]: [] },
      drafts: { ...s.drafts, [chat.id]: draft },
      unscoped,
      activeChatId: chat.id,
      notice: null,
      scopePickerFor: scope ? null : chat.id,
    };
  });

  const setDraft = (chatId: string, value: string) => setM((s) => ({ ...s, drafts: { ...s.drafts, [chatId]: value } }));

  /** Changing scope never rewrites a chat with messages: it starts a new chat and carries the draft. */
  const changeScope = (chatId: string, scope: Scope) => setM((s) => {
    const chat = s.chats.find((c) => c.id === chatId);
    if (!chat) return s;
    remembered.current[chat.projectId] = scope;
    const hasMessages = (s.messages[chatId] ?? []).length > 0;
    const unscoped = new Set(s.unscoped);
    if (!hasMessages) {
      unscoped.delete(chatId);
      const updated: Chat = { ...chat, chatType: scope.kind === "galaxy" ? "galaxy" : "constellation", constellationId: scope.kind === "constellation" ? scope.id : undefined };
      return { ...s, chats: s.chats.map((c) => (c.id === chatId ? updated : c)), unscoped, scopePickerFor: null };
    }
    const fresh = makeChat(chat.projectId, scope);
    const draft = s.drafts[chatId] ?? "";
    return {
      ...s,
      chats: [...s.chats, fresh],
      messages: { ...s.messages, [fresh.id]: [] },
      drafts: { ...s.drafts, [chatId]: "", [fresh.id]: draft },
      activeChatId: fresh.id,
      scopePickerFor: null,
      notice: `New chat started with ${scopeLabel(scope, scenario.constellations)}. "${chat.label}" is unchanged.`,
    };
  });

  const openScopePicker = (chatId: string | null) => setM((s) => ({ ...s, scopePickerFor: chatId }));

  /** Galaxy chats may route one message to a chosen Constellation (existing GalaxyRouteSelector). */
  const send = (chatId: string, routeConstellationId?: string) => {
    let sent = "";
    setM((s) => {
      const text = (s.drafts[chatId] ?? "").trim();
      if (!text) return s;
      if (s.unscoped.has(chatId)) return { ...s, scopePickerFor: chatId };
      sent = text;
      const chat = s.chats.find((c) => c.id === chatId);
      const label = chat && /^New chat \d+$/.test(chat.label) ? text.slice(0, 28) : chat?.label;
      return {
        ...s,
        chats: s.chats.map((c) => (c.id === chatId && label ? { ...c, label } : c)),
        messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), { id: `${chatId}-u${Date.now()}`, role: "user", content: text, timestamp: now() }] },
        drafts: { ...s.drafts, [chatId]: "" },
        notice: null,
      };
    });
    window.setTimeout(() => {
      if (!sent) return;
      setM((s) => {
        const chat = s.chats.find((c) => c.id === chatId);
        if (!chat) return s;
        const scope = scopeOf(chat);
        const usable = usableConstellations(scenario, chat.projectId);
        const source = scope.kind === "constellation"
          ? usable.find((c) => c.id === scope.id)
          : usable.find((c) => c.id === routeConstellationId) ?? usable[0];
        const reply: Message = {
          id: `${chatId}-a${Date.now()}`,
          role: "ai",
          content: scope.kind === "galaxy"
            ? routeConstellationId
              ? `Galaxy answered from ${source?.label ?? "the chosen Constellation"}, as routed for this message. Simulated answer (prototype).`
              : `Galaxy picked ${source?.label ?? "a Constellation"} for this question. Simulated answer (prototype).`
            : `Simulated answer from ${source?.label ?? "this Constellation"} (prototype).`,
          timestamp: now(),
          sources: source ? [{ id: source.id, label: source.label }] : undefined,
        };
        return { ...s, messages: { ...s.messages, [chatId]: [...(s.messages[chatId] ?? []), reply] } };
      });
    }, 500);
  };

  /** Close hides a chat; it stays in History. Nothing is deleted. */
  /** Close hides a chat (never deletes). The next chat is its neighbour in the same Project. */
  const close = (chatId: string) => setM((s) => {
    const chat = s.chats.find((c) => c.id === chatId);
    if (!chat) return s;
    const before = s.chats.filter((c) => c.projectId === chat.projectId && !s.hidden.has(c.id));
    const index = before.findIndex((c) => c.id === chatId);
    const hidden = new Set(s.hidden).add(chatId);
    const rest = before.filter((c) => c.id !== chatId);
    const next = rest[Math.min(index, rest.length - 1)] ?? null;
    return {
      ...s,
      hidden,
      activeChatId: s.activeChatId === chatId ? next?.id ?? null : s.activeChatId,
      notice: `"${chat.label}" closed. You can reopen it any time.`,
    };
  });

  /** Opens any chat (also closed ones) and makes its Project current in the same step. */
  const openChat = (chatId: string) => setM((s) => {
    const chat = s.chats.find((c) => c.id === chatId);
    if (!chat) return s;
    const current = s.chats.find((c) => c.id === s.activeChatId);
    if (current) lastOpened.current[current.projectId] = current.id;
    const hidden = new Set(s.hidden);
    hidden.delete(chatId);
    return { ...s, projectId: chat.projectId, activeChatId: chatId, hidden, scopePickerFor: null };
  });

  /** Explicit, confirmed delete (from the real header's options menu), separate from Close. */
  const remove = (chatId: string) => setM((s) => {
    const chat = s.chats.find((c) => c.id === chatId);
    const chats = s.chats.filter((c) => c.id !== chatId);
    const rest = chats.filter((c) => c.projectId === s.projectId && !s.hidden.has(c.id));
    return { ...s, chats, activeChatId: s.activeChatId === chatId ? rest[0]?.id ?? null : s.activeChatId, notice: chat ? `"${chat.label}" deleted.` : s.notice };
  });

  const reopen = (chatId: string) => setM((s) => {
    const hidden = new Set(s.hidden);
    hidden.delete(chatId);
    return { ...s, hidden, activeChatId: chatId, notice: null };
  });

  const togglePin = (chatId: string) => setM((s) => ({ ...s, chats: s.chats.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c)) }));
  const rename = (chatId: string, label: string) => setM((s) => ({ ...s, chats: s.chats.map((c) => (c.id === chatId ? { ...c, label } : c)) }));
  const dismissNotice = () => setM((s) => ({ ...s, notice: null }));

  return { m, visibleChats: (pid: string) => visibleChats(m, pid), selectProject, selectChat, newChat, setDraft, changeScope, openScopePicker, send, close, remove, reopen, openChat, togglePin, rename, dismissNotice };
}

export type ProposedApi = ReturnType<typeof useProposedModel>;
