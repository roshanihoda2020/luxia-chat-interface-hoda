import type { ProjectDashboardOutput } from "./types";

const STORAGE_KEY = "luxia.dashboard.user-outputs.v1";

type DashboardOutputStoreSnapshot = {
  version: 1;
  outputs: ProjectDashboardOutput[];
};

type Listener = () => void;

const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDashboardOutputStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStore(): ProjectDashboardOutput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashboardOutputStoreSnapshot;
    if (parsed?.version !== 1 || !Array.isArray(parsed.outputs)) return [];
    return parsed.outputs.filter(
      (item) =>
        item
        && typeof item.id === "string"
        && typeof item.projectId === "string"
        && typeof item.name === "string",
    );
  } catch {
    return [];
  }
}

function writeStore(outputs: ProjectDashboardOutput[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    const snapshot: DashboardOutputStoreSnapshot = { version: 1, outputs };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    emit();
    return true;
  } catch {
    return false;
  }
}

export function listUserDashboardOutputs(projectId?: string): ProjectDashboardOutput[] {
  const all = readStore();
  if (!projectId) return all.slice().sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
  return all
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
}

export function getDashboardOutputById(outputId: string): ProjectDashboardOutput | null {
  const id = outputId.trim();
  if (!id) return null;
  return readStore().find((item) => item.id === id) ?? null;
}

export function createDashboardOutput(input: {
  projectId: string;
  name: string;
  createdByUserId: string;
  outputType?: ProjectDashboardOutput["outputType"];
  conversationSource?: ProjectDashboardOutput["conversationSource"];
  sourceContext?: string;
}): ProjectDashboardOutput | null {
  const name = input.name.trim() || "Untitled document";
  const now = Date.now();
  const record: ProjectDashboardOutput = {
    id: `dashboard-output-${now}-${Math.random().toString(36).slice(2, 8)}`,
    projectId: input.projectId,
    name,
    outputType: input.outputType ?? "report",
    conversationSource: input.conversationSource ?? "galaxy",
    sourceContext: input.sourceContext ?? "Writing Assistant",
    updatedAt: "Just now",
    updatedAtTimestamp: now,
    createdByUserId: input.createdByUserId,
  };
  const next = [record, ...readStore().filter((item) => item.id !== record.id)];
  const ok = writeStore(next);
  return ok ? record : null;
}

export function updateDashboardOutput(
  outputId: string,
  patch: Partial<Pick<
    ProjectDashboardOutput,
    "name" | "projectId" | "outputType" | "conversationSource" | "sourceContext"
  >>,
): ProjectDashboardOutput | null {
  const existing = getDashboardOutputById(outputId);
  if (!existing) return null;
  const now = Date.now();
  const nextName =
    typeof patch.name === "string" ? (patch.name.trim() || "Untitled document") : existing.name;
  const record: ProjectDashboardOutput = {
    ...existing,
    ...patch,
    name: nextName,
    updatedAt: "Just now",
    updatedAtTimestamp: now,
  };
  const next = [record, ...readStore().filter((item) => item.id !== record.id)];
  const ok = writeStore(next);
  return ok ? record : null;
}
