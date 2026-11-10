/**
 * Luxia AI on Home: the platform assistant's configuration and its demo answers.
 *
 * Luxia AI is separate from Project Chat. It never reads Project, Galaxy,
 * Constellation or Data Source content. Today it runs in demo mode: every answer
 * is a prepared text about using Luxia, chosen by matching the question's words.
 */

export type LuxiaAssistantResponseMode = "demo";

export interface LuxiaAssistantKnowledgeSource {
  id: string;
  label: string;
  /** Platform help only. Project knowledge is never a Luxia AI source. */
  scope: "platform";
  /** Who maintains it once Luxia AI has managed knowledge. */
  owner: "luxia" | "organization-admin";
}

export interface LuxiaAssistantConfig {
  displayName: string;
  responseMode: LuxiaAssistantResponseMode;
  /** Shown with every conversation so nobody mistakes demo answers for a live model. */
  disclosure: string;
  suggestedQuestions: readonly string[];
  knowledgeSources: readonly LuxiaAssistantKnowledgeSource[];
  /** Organisation instructions for the assistant: a future admin setting, not editable in the prototype. */
  instructions: { owner: "organization-admin"; editableInPrototype: false };
}

export const LUXIA_ASSISTANT_CONFIG: LuxiaAssistantConfig = {
  displayName: "Luxia AI",
  responseMode: "demo",
  disclosure: "Demo answers: prepared help about using Luxia, not a live AI model.",
  suggestedQuestions: ["What can Luxia do?", "How do I get started?", "What tools can I use?"],
  knowledgeSources: [{ id: "platform-help", label: "Luxia platform help", scope: "platform", owner: "luxia" }],
  instructions: { owner: "organization-admin", editableInPrototype: false },
};

/** Real destinations an answer may offer. Home supplies only the ones this user can use. */
export type LuxiaAssistantActionId =
  | "projects"
  | "new-project"
  | "data-sources"
  | "writing-assistant"
  | "chat-history"
  | "customize-home"
  | "explore"
  | "project-chat";

export const LUXIA_ASSISTANT_ACTION_LABELS: Record<LuxiaAssistantActionId, string> = {
  projects: "Open Projects",
  "new-project": "New Project",
  "data-sources": "Open Data Sources",
  "writing-assistant": "Open Writing Assistant",
  "chat-history": "Open Chat history",
  "customize-home": "Customize Home",
  explore: "Open Explore Luxia",
  "project-chat": "Chat in a Project",
};

export interface LuxiaAssistantAbilities {
  canCreateProject: boolean;
  canAddDataSources: boolean;
  hasProjects: boolean;
}

export interface LuxiaAssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: LuxiaAssistantActionId[];
  followUps?: string[];
}

interface Topic {
  id: string;
  keywords: readonly string[];
  answer: (abilities: LuxiaAssistantAbilities) => string;
  actions: (abilities: LuxiaAssistantAbilities) => LuxiaAssistantActionId[];
  followUps: readonly string[];
}

const TOPICS: readonly Topic[] = [
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "good morning", "thanks", "thank you"],
    answer: () => "Hello! I can help you find your way around Luxia: Projects, Data Sources, Constellations, Galaxies, Chats, tools and your Home.",
    actions: () => [],
    followUps: ["What can Luxia do?", "How do I get started?"],
  },
  {
    id: "difference",
    keywords: ["difference", "different", "project chat", "luxia ai", "who are you", "what are you"],
    answer: () =>
      "I'm Luxia AI, for help with using Luxia itself. To ask about your organisation's documents and data, use Chat in a Project: those answers come only from that Project's knowledge, with sources. I can't see any Project content.",
    actions: (a) => (a.hasProjects ? ["project-chat"] : []),
    followUps: ["What is a Galaxy?", "What is a Constellation?"],
  },
  {
    id: "overview",
    keywords: ["what can luxia", "what does luxia", "what is luxia", "about luxia", "luxia do", "capabilities", "features"],
    answer: () =>
      "Luxia lets your teams ask questions about their own documents and data and get answers with sources. Work is organised in Projects. Inside a Project, Constellations hold the knowledge a Chat answers from, and a Galaxy lets you ask across the whole Project. You can also write with the Writing Assistant and keep Dashboards of your outputs.",
    actions: () => ["projects", "explore"],
    followUps: ["How do I get started?", "What is a Constellation?"],
  },
  {
    id: "getting-started",
    keywords: ["get started", "getting started", "start", "starting", "begin", "first step", "first steps", "new to", "onboarding", "how do i use"],
    answer: (a) =>
      `A good first path: ${a.hasProjects ? "open one of your Projects" : a.canCreateProject ? "create a Project" : "ask an admin to invite you to a Project"}, make sure it has a Constellation (its knowledge), then start a Chat and check the sources in the answer. ${a.canAddDataSources ? "If your data isn't in Luxia yet, add it as a Data Source first." : "Data Sources shared with you are listed under Data Sources."}`,
    actions: (a) => [a.hasProjects ? "projects" : a.canCreateProject ? "new-project" : "projects", "data-sources"],
    followUps: ["What is a Data Source?", "What is a Constellation?"],
  },
  {
    id: "projects",
    keywords: ["project", "projects", "workspace", "team space"],
    answer: (a) =>
      `A Project is a shared space for a team's knowledge, Chats and outputs. You only see the Projects you're a member of. ${a.canCreateProject ? "You can create a new one with New Project." : "New Projects are created by people with permission to do so."}`,
    actions: (a) => (a.canCreateProject ? ["projects", "new-project"] : ["projects"]),
    followUps: ["What is a Constellation?", "What is a Galaxy?"],
  },
  {
    id: "data-sources",
    keywords: ["data source", "data sources", "connect", "upload", "csv", "database", "databases", "import", "file", "files", "my data"],
    answer: (a) =>
      a.canAddDataSources
        ? "Data Sources are where your data comes into Luxia: databases, CSV files and documents. You can add one under Data Sources; Projects then use it through their Constellations."
        : "Data Sources are where data comes into Luxia: databases, CSV files and documents. Admins connect new ones; under Data Sources you'll find those shared with you.",
    actions: () => ["data-sources"],
    followUps: ["What is a Constellation?", "How do I get started?"],
  },
  {
    id: "constellations",
    keywords: ["constellation", "constellations", "knowledge", "source of answers"],
    answer: () =>
      "A Constellation is the knowledge a Chat answers from, built on one or more Data Sources inside a Project. You find them in a Project under Constellations. A Chat in a Project uses one Constellation, so its answers stay within that knowledge.",
    actions: () => ["projects"],
    followUps: ["What is a Galaxy?", "What is a Data Source?"],
  },
  {
    id: "galaxies",
    keywords: ["galaxy", "galaxies", "whole project", "across the project", "all constellations"],
    answer: () =>
      "A Galaxy asks across a whole Project: it picks the right Constellation for each question. Each Project has one. To use it, choose Chat in a Project here and pick Galaxy as the Chat type.",
    actions: (a) => (a.hasProjects ? ["project-chat"] : ["projects"]),
    followUps: ["What is a Constellation?", "Where are my Chats?"],
  },
  {
    id: "chats",
    keywords: ["chat history", "my chats", "previous", "recent chats", "conversations", "where are my chats", "continue", "chats"],
    answer: () =>
      "Your Project Chats and Galaxy conversations are listed in Chat history, most recent first. The latest ones also appear under Continue, just below this box. This Luxia AI conversation is separate and stays on Home.",
    actions: () => ["chat-history"],
    followUps: ["What is a Galaxy?", "How do I customize Home?"],
  },
  {
    id: "writing",
    keywords: ["writing assistant", "write", "writing", "draft", "drafts", "edit text"],
    answer: () =>
      "The Writing Assistant (Beta) helps you write, edit and improve parts of a document with AI assistance. It's one of the Tools in the sidebar.",
    actions: () => ["writing-assistant"],
    followUps: ["What tools are there?", "What can Luxia do?"],
  },
  {
    id: "tools",
    keywords: ["tool", "tools", "agents", "agent"],
    answer: () =>
      "Tools are standalone capabilities in the sidebar. Today that's the Writing Assistant (Beta). New tools will appear there and can be added to Home as tiles.",
    actions: () => ["writing-assistant"],
    followUps: ["How do I customize Home?"],
  },
  {
    id: "dashboards",
    keywords: ["dashboard", "dashboards", "outputs", "reports"],
    answer: () =>
      "Dashboards collect outputs from a Project's Chats. Each belongs to a Project: open the Project and go to Dashboards. You can also add a Dashboards tile to Home.",
    actions: () => ["projects"],
    followUps: ["How do I customize Home?"],
  },
  {
    id: "vidgets",
    keywords: ["vidget", "vidgets", "customer assistant", "website assistant", "whatsapp"],
    answer: () =>
      "Vidgets are customer-facing assistants for your website or WhatsApp. They belong to a Project, and the people who manage or review them find them in that Project under Vidgets.",
    actions: () => ["projects"],
    followUps: ["What is a Project?"],
  },
  {
    id: "home",
    keywords: ["customize", "customise", "customizing", "home", "layout", "tile", "tiles", "rearrange"],
    answer: () =>
      "Choose Customize Home to add, move, resize and restyle tiles. You can save your layout, restore it later, or reset to the Luxia default. Your layout is kept for you only.",
    actions: () => ["customize-home"],
    followUps: ["What tools are there?", "Where are my Chats?"],
  },
  {
    id: "whats-new",
    keywords: ["what's new", "whats new", "new features", "release", "updates", "explore"],
    answer: () => "Explore Luxia lists recent releases and what they mean for you. Relevant updates also appear in the short notice on Home.",
    actions: () => ["explore"],
    followUps: ["What can Luxia do?"],
  },
];

function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

/** The demo answer for a question: the topic whose keywords match best, or an honest fallback. */
export function answerLuxiaAssistant(question: string, abilities: LuxiaAssistantAbilities): Omit<LuxiaAssistantMessage, "id" | "role"> {
  const text = normalise(question);
  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    const score = topic.keywords.reduce((sum, keyword) => (text.includes(` ${keyword} `) ? sum + keyword.length : sum), 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  if (!best) {
    return {
      text: abilities.hasProjects
        ? "I don't have an answer for that in this demo. I only know how Luxia works. If your question is about your organisation's documents or data, use Chat in a Project: it answers from that Project's knowledge, with sources."
        : "I don't have an answer for that in this demo. I only know how Luxia works. Questions about your organisation's documents are answered in a Project, once you're a member of one.",
      actions: abilities.hasProjects ? ["project-chat"] : [],
      followUps: ["What can Luxia do?", "How do I get started?"],
    };
  }
  return { text: best.answer(abilities), actions: best.actions(abilities), followUps: [...best.followUps] };
}

/** Each user's Home conversation, kept for this browser session (until reload). */
const conversations = new Map<string, LuxiaAssistantMessage[]>();

export function readLuxiaConversation(key: string): LuxiaAssistantMessage[] {
  return conversations.get(key) ?? [];
}

export function writeLuxiaConversation(key: string, messages: LuxiaAssistantMessage[]): void {
  if (messages.length === 0) conversations.delete(key);
  else conversations.set(key, messages);
}
