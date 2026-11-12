import type { Chat, Constellation, Message } from "@/app/app-sections/appSectionShared";
import type { HomeProjectCard } from "@/app/features/project/types";
import type { ProjectRole } from "@/app/features/permissions/types";

export type ScenarioId = "one" | "two" | "many-projects" | "unconfigured" | "many-chats" | "long-names" | "distinct-knowledge";

export interface Scenario {
  id: ScenarioId;
  label: string;
  hint: string;
  projects: HomeProjectCard[];
  constellations: Constellation[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  /** Project opened first in the Chat Environment. */
  startProjectId: string;
  /** Constellations that exist but this user may not access (private Data Sources): never offered. */
  restrictedConstellationIds?: string[];
}

const NAMES = Array.from({ length: 12 }, (_, i) => `Project name ${String(i + 1).padStart(2, "0")}`);

function project(index: number, constellationCount: number, role: ProjectRole, memberCount = 6, name?: string): HomeProjectCard {
  const id = `ux-p${String(index + 1).padStart(2, "0")}`;
  return {
    id,
    name: name ?? NAMES[index],
    galaxyId: `${id}-galaxy`,
    constellationCount,
    sourceCount: constellationCount,
    memberCount,
    updatedAt: `${index + 1}h ago`,
    updatedAtTimestamp: Date.now() - (index + 1) * 3_600_000,
    isPinned: false,
    isFeatured: false,
    isEmpty: constellationCount === 0,
    status: "active",
    viewerProjectRole: role,
  };
}

const CONSTELLATION_SET: Array<Pick<Constellation, "label" | "type" | "description">> = [
  { label: "Supplier contracts", type: "pdf", description: "Contracts and amendments" },
  { label: "Sales figures", type: "csv", description: "Monthly sales exports" },
  { label: "Operations database", type: "database", description: "Orders and deliveries" },
];

type Source = Pick<Constellation, "label" | "type" | "description">;
function constellationsFor(projectId: string, count: number, sources?: Source[]): Constellation[] {
  return (sources ?? CONSTELLATION_SET.slice(0, count)).map((entry, i) => ({ id: `${projectId}-c${i + 1}`, projectId, ...entry }));
}

const QUESTIONS = [
  "What changed in the supplier contract between 2025 and 2026?",
  "Which region grew fastest last quarter?",
  "How many late deliveries were there in October?",
  "Summarise the payment terms",
  "Compare Q2 and Q3 revenue",
  "Which suppliers have renewal dates this year?",
];

function seedMessages(chat: Chat, constellations: Constellation[], index: number): Message[] {
  const source = chat.constellationId ? constellations.find((c) => c.id === chat.constellationId) : constellations[0];
  const question = QUESTIONS[index % QUESTIONS.length];
  return [
    { id: `${chat.id}-u`, role: "user", content: question, timestamp: "10:2" + (index % 10) },
    {
      id: `${chat.id}-a`,
      role: "ai",
      content: chat.chatType === "galaxy"
        ? `Galaxy used ${source?.label ?? "a Constellation"} for this question. Sample answer for the UX comparison prototype.`
        : `Sample answer from ${source?.label ?? "this Constellation"} for the UX comparison prototype.`,
      timestamp: "10:2" + (index % 10),
      sources: source ? [{ id: source.id, label: source.label }] : undefined,
    },
  ];
}

function chatsFor(p: HomeProjectCard, constellations: Constellation[], count: number, offset: number): Chat[] {
  const own = constellations.filter((c) => c.projectId === p.id);
  const chats: Chat[] = [];
  if (own.length > 0) chats.push({ id: `${p.id}-galaxy`, label: "Galaxy", chatType: "galaxy", projectId: p.id });
  for (let i = 0; i < count && own.length > 0; i++) {
    const c = own[i % own.length];
    chats.push({
      id: `${p.id}-chat${i + 1}`,
      label: `Chat name ${String(offset + i + 1).padStart(2, "0")}`,
      chatType: "constellation",
      projectId: p.id,
      constellationId: c.id,
      pinned: i === 0,
    });
  }
  return chats;
}

function build(id: ScenarioId, label: string, hint: string, specs: Array<{ constellations: number; chats: number; role?: ProjectRole; name?: string; sources?: Source[] }>): Scenario {
  const projects = specs.map((spec, i) => project(i, spec.sources?.length ?? spec.constellations, spec.role ?? "Analyst", 6, spec.name));
  const constellations = projects.flatMap((p, i) => constellationsFor(p.id, specs[i].constellations, specs[i].sources));
  let offset = 0;
  const chats = projects.flatMap((p, i) => {
    const list = chatsFor(p, constellations, specs[i].chats, offset);
    offset += specs[i].chats;
    return list;
  });
  const messages: Record<string, Message[]> = {};
  chats.forEach((chat, i) => { messages[chat.id] = seedMessages(chat, constellations, i); });
  return { id, label, hint, projects, constellations, chats, messages, startProjectId: projects[0].id };
}

export const SCENARIOS: Scenario[] = [
  build("one", "1 Project", "User belongs to one Project with 3 Constellations.", [{ constellations: 3, chats: 4 }]),
  build("two", "2 Projects", "User belongs to two Projects.", [{ constellations: 3, chats: 4 }, { constellations: 2, chats: 3 }]),
  build("many-projects", "Many Projects", "About 12 Projects with a few chats each.", Array.from({ length: 12 }, (_, i) => ({ constellations: (i % 3) + 1, chats: (i % 3) + 1 }))),
  build("unconfigured", "Unconfigured Project", "Project name 02 exists but has no usable Constellations.", [{ constellations: 3, chats: 3 }, { constellations: 0, chats: 0 }]),
  build("many-chats", "Many chats", "Two Projects; the first has 30 conversations.", [{ constellations: 3, chats: 30 }, { constellations: 2, chats: 3 }]),
  {
    // Each Project has its OWN knowledge; "Team notes" exists in two Projects (same name, different Constellations);
    // "Board minutes" in Marketing AI is private to someone else and must never be offered.
    ...build("distinct-knowledge", "Project-specific knowledge", "Marketing AI and Procurement have different Constellations (one shared name); Legal has one; Onboarding has none.", [
      { constellations: 0, chats: 3, name: "Marketing AI", sources: [
        { label: "Sales 2026", type: "csv", description: "Monthly sales exports 2026" },
        { label: "Marketing documents", type: "pdf", description: "Campaign briefs and plans" },
        { label: "Team notes", type: "pdf", description: "Marketing team notes" },
        { label: "Board minutes", type: "pdf", description: "Private: owner only" },
      ] },
      { constellations: 0, chats: 3, name: "Procurement", sources: [
        { label: "Supplier contracts", type: "pdf", description: "Contracts and amendments" },
        { label: "Finance database", type: "database", description: "Invoices and payments" },
        { label: "Team notes", type: "pdf", description: "Procurement team notes" },
      ] },
      { constellations: 0, chats: 1, name: "Legal", sources: [{ label: "Policy library", type: "pdf", description: "Company policies" }] },
      { constellations: 0, chats: 0, name: "Onboarding" },
    ]),
    restrictedConstellationIds: ["ux-p01-c4"],
  },
  build("long-names", "Long Project names", "Three Projects with long, realistic names.", [
    { constellations: 3, chats: 6, name: "Northern Europe Supplier Contract Renewals 2026 (Procurement & Legal)" },
    { constellations: 2, chats: 3, name: "Customer Support Quality Programme — Q3 Retrospective" },
    { constellations: 1, chats: 2, name: "Operations" },
  ]),
];

export type DemoRole = "owner-manager" | "analyst-member";

export const ROLE_LABEL: Record<DemoRole, string> = {
  "owner-manager": "Project Owner",
  "analyst-member": "Member",
};
