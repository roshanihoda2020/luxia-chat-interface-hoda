import type { VidgetRecord, VidgetSourceType } from "./types";

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function normalizeGalaxyConstellationIds(
  ids: string[] | null | undefined,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of ids ?? []) {
    const id = raw?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function normalizeVidgetSource(input: {
  sourceType: VidgetSourceType;
  galaxyId: string | null | undefined;
  constellationId: string | null | undefined;
  galaxyConstellationIds?: string[] | null | undefined;
}): {
  sourceType: VidgetSourceType;
  galaxyId: string | null;
  constellationId: string | null;
  galaxyConstellationIds: string[];
} | null {
  if (input.sourceType === "galaxy") {
    const galaxyId = input.galaxyId?.trim() || null;
    if (!galaxyId) return null;
    return {
      sourceType: "galaxy",
      galaxyId,
      constellationId: null,
      galaxyConstellationIds: normalizeGalaxyConstellationIds(input.galaxyConstellationIds),
    };
  }
  const constellationId = input.constellationId?.trim() || null;
  if (!constellationId) return null;
  return {
    sourceType: "constellation",
    galaxyId: null,
    constellationId,
    galaxyConstellationIds: [],
  };
}

export function isValidVidgetSource(record: Pick<
  VidgetRecord,
  "sourceType" | "galaxyId" | "constellationId" | "galaxyConstellationIds"
>): boolean {
  const shape = normalizeVidgetSource(record);
  if (!shape) return false;
  if (shape.sourceType === "galaxy") {
    return shape.galaxyConstellationIds.length > 0;
  }
  return true;
}

export type VidgetScopeValidation = {
  valid: boolean;
  message?: string;
};

/** Validate Galaxy/Constellation scope belongs to the current Project. */
export function validateVidgetScopeForProject(
  record: Pick<
    VidgetRecord,
    | "projectId"
    | "sourceType"
    | "galaxyId"
    | "constellationId"
    | "galaxyConstellationIds"
  >,
  constellations: { id: string; projectId: string }[],
): VidgetScopeValidation {
  const shape = normalizeVidgetSource(record);
  if (!shape) {
    return { valid: false, message: "A valid Vidget source is required." };
  }

  const projectConstellationIds = new Set(
    constellations
      .filter((item) => item.projectId === record.projectId)
      .map((item) => item.id),
  );

  if (shape.sourceType === "constellation") {
    if (!projectConstellationIds.has(shape.constellationId!)) {
      return {
        valid: false,
        message: "Choose a Constellation that belongs to this Project.",
      };
    }
    return { valid: true };
  }

  if (shape.galaxyConstellationIds.length === 0) {
    return {
      valid: false,
      message: "Select at least one Constellation for knowledge scope.",
    };
  }

  for (const id of shape.galaxyConstellationIds) {
    if (!projectConstellationIds.has(id)) {
      return {
        valid: false,
        message: "Every selected Constellation must belong to this Project.",
      };
    }
  }

  if (!isValidVidgetSource(shape)) {
    return {
      valid: false,
      message: "Select at least one Constellation for knowledge scope.",
    };
  }

  return { valid: true };
}

export type VidgetCreateSourceInput = {
  sourceType: VidgetSourceType;
  galaxyId: string | null;
  constellationId: string | null;
  galaxyConstellationIds: string[];
};

export type VidgetCreateSourceContext = {
  projectId: string;
  projectGalaxyId: string | null;
  projectConstellations: { id: string; projectId: string }[];
};

type NormalizedVidgetSource = NonNullable<ReturnType<typeof normalizeVidgetSource>>;

export function resolveVidgetCreateSource(
  payload: VidgetCreateSourceInput,
  context: VidgetCreateSourceContext,
):
  | { ok: true; source: NormalizedVidgetSource }
  | { ok: false; message: string } {
  let galaxyId = payload.galaxyId;
  let constellationId = payload.constellationId?.trim() || null;
  let galaxyConstellationIds = normalizeGalaxyConstellationIds(
    payload.galaxyConstellationIds,
  );

  if (payload.sourceType === "galaxy") {
    galaxyId = context.projectGalaxyId;
    constellationId = null;
    if (!galaxyId) {
      return {
        ok: false,
        message: "This Project has no Galaxy available for a Vidget source.",
      };
    }
  } else {
    galaxyId = null;
    galaxyConstellationIds = [];
    if (!constellationId) {
      return { ok: false, message: "Choose a Constellation source." };
    }
    if (
      !context.projectConstellations.some(
        (item) => item.id === constellationId && item.projectId === context.projectId,
      )
    ) {
      return {
        ok: false,
        message: "Choose a Constellation that belongs to this Project.",
      };
    }
  }

  const source = normalizeVidgetSource({
    sourceType: payload.sourceType,
    galaxyId,
    constellationId,
    galaxyConstellationIds,
  });
  if (!source) {
    return { ok: false, message: "A valid Vidget source is required." };
  }

  const scopeCheck = validateVidgetScopeForProject(
    { projectId: context.projectId, ...source },
    context.projectConstellations,
  );
  if (!scopeCheck.valid) {
    return {
      ok: false,
      message: scopeCheck.message ?? "Invalid Vidget source scope.",
    };
  }

  return { ok: true, source };
}

/** Prototype hosted/embed URLs keyed to the Vidget id — assigned on Web publish only. */
export function buildVidgetDeploymentFields(
  record: Pick<VidgetRecord, "id" | "projectId" | "channel">,
): Pick<VidgetRecord, "hostedUrl" | "embedSnippet"> {
  if (record.channel !== "web") {
    return { hostedUrl: null, embedSnippet: null };
  }
  return {
    hostedUrl: `https://vidget.luxia.example/${record.projectId}/${record.id}`,
    embedSnippet: `<script src="https://vidget.luxia.example/embed.js" data-vidget="${record.id}"></script>`,
  };
}

function baseVidget(
  partial: Pick<
    VidgetRecord,
    | "id"
    | "projectId"
    | "name"
    | "channel"
    | "sourceType"
    | "galaxyId"
    | "constellationId"
    | "galaxyConstellationIds"
    | "status"
    | "updatedAt"
  > & Partial<VidgetRecord>,
): VidgetRecord {
  const source = normalizeVidgetSource({
    sourceType: partial.sourceType,
    galaxyId: partial.galaxyId,
    constellationId: partial.constellationId,
    galaxyConstellationIds: partial.galaxyConstellationIds,
  });
  if (!source || !isValidVidgetSource(source)) {
    throw new Error("Vidget requires a valid source configuration.");
  }

  const record: VidgetRecord = {
    assistantName: "Luxia Assistant",
    language: "English",
    welcomeMessage: "Hello — how can I help you today?",
    themeId: "theme-default",
    avatarId: "avatar-01",
    experienceMode: "avatar",
    microphoneEnabled: true,
    chatHistoryEnabled: true,
    qrEnabled: partial.channel === "web",
    bubbleSize: "md",
    tooltipText: "Chat with us",
    webPresentation: "hosted",
    companyLogoName: null,
    backgroundImageName: null,
    chatBubbleLogoName: null,
    privacyPolicyFileName: null,
    privacyPolicyUrl: null,
    vidgetInstruction: "",
    hostedUrl: null,
    embedSnippet: null,
    lastPublishedAt: null,
    ...partial,
    sourceType: source.sourceType,
    galaxyId: source.galaxyId,
    constellationId: source.constellationId,
    galaxyConstellationIds: source.galaxyConstellationIds,
  };

  if (record.status === "published" && record.channel === "web") {
    const deployment = buildVidgetDeploymentFields(record);
    record.hostedUrl = deployment.hostedUrl;
    record.embedSnippet = deployment.embedSnippet;
    record.lastPublishedAt = record.lastPublishedAt ?? record.updatedAt;
  }

  return record;
}

export const SEED_VIDGETS: VidgetRecord[] = [
  baseVidget({
    id: "vidget-01",
    projectId: "project-01",
    name: "Vidget name 01",
    channel: "web",
    sourceType: "galaxy",
    galaxyId: "galaxy-01",
    constellationId: null,
    galaxyConstellationIds: ["con1", "con3", "con4"],
    status: "published",
    updatedAt: isoHoursAgo(2),
    assistantName: "Assistant name 01",
    themeId: "theme-01",
    avatarId: "avatar-02",
    webPresentation: "hosted",
    welcomeMessage: "Welcome — ask me anything about this experience.",
    lastPublishedAt: isoHoursAgo(2),
    privacyPolicyFileName: "privacy-policy.pdf",
  }),
  baseVidget({
    id: "vidget-02",
    projectId: "project-01",
    name: "Vidget name 02",
    channel: "whatsapp",
    sourceType: "constellation",
    galaxyId: null,
    constellationId: "con2",
    galaxyConstellationIds: [],
    status: "draft",
    updatedAt: isoDaysAgo(1),
    assistantName: "Assistant name 02",
    avatarId: "avatar-03",
    experienceMode: "no-avatar",
    microphoneEnabled: false,
    qrEnabled: false,
  }),
  baseVidget({
    id: "vidget-03",
    projectId: "project-01",
    name: "Vidget name 03",
    channel: "voip",
    sourceType: "galaxy",
    galaxyId: "galaxy-01",
    constellationId: null,
    galaxyConstellationIds: ["con1"],
    status: "draft",
    updatedAt: isoDaysAgo(3),
    assistantName: "Assistant name 03",
    avatarId: "avatar-04",
    experienceMode: "voice-only",
    chatHistoryEnabled: false,
    qrEnabled: false,
    themeId: "theme-02",
  }),
  baseVidget({
    id: "vidget-p2-01",
    projectId: "project-02",
    name: "Vidget name 04",
    channel: "web",
    sourceType: "galaxy",
    galaxyId: "galaxy-02",
    constellationId: null,
    galaxyConstellationIds: ["con6", "con7"],
    status: "published",
    updatedAt: isoHoursAgo(8),
    webPresentation: "totem",
    avatarId: "avatar-05",
  }),
  baseVidget({
    id: "vidget-p3-01",
    projectId: "project-03",
    name: "Vidget name 05",
    channel: "web",
    sourceType: "constellation",
    galaxyId: null,
    constellationId: "con9",
    galaxyConstellationIds: [],
    status: "draft",
    updatedAt: isoDaysAgo(2),
    avatarId: "avatar-06",
  }),
];

export const VIDGET_SOURCE_UNAVAILABLE_LABEL = "Source unavailable";

export type VidgetScopeItem = {
  id: string;
  name: string;
  available: boolean;
};

export type VidgetSourceDisplay = {
  available: boolean;
  label: string;
  sourceType: VidgetSourceType;
  scopeSummary?: string;
  scopeCount?: number;
  scopeItems?: VidgetScopeItem[];
};

export type VidgetSourceContext = {
  projectGalaxyId: string | null | undefined;
  galaxyName: string | null | undefined;
  constellation:
    | { id: string; projectId: string; name: string }
    | null
    | undefined;
  projectConstellations?: { id: string; projectId: string; name: string }[];
};

function buildScopeSummary(count: number): string {
  if (count === 1) return "1 Constellation";
  return `${count} Constellations`;
}

function resolveGalaxyScopeItems(
  record: Pick<VidgetRecord, "projectId" | "galaxyConstellationIds">,
  context: VidgetSourceContext,
): VidgetScopeItem[] {
  const ids = normalizeGalaxyConstellationIds(record.galaxyConstellationIds);
  return ids.map((id) => {
    const match = context.projectConstellations?.find(
      (item) => item.id === id && item.projectId === record.projectId,
    );
    return {
      id,
      name: match?.name?.trim() || id,
      available: Boolean(match),
    };
  });
}

/**
 * Resolve Vidget intelligence source within its Project.
 * Cross-Project or missing sources are unavailable — never silently remapped.
 */
export function resolveVidgetSourceDisplay(
  record: Pick<
    VidgetRecord,
    | "projectId"
    | "sourceType"
    | "galaxyId"
    | "constellationId"
    | "galaxyConstellationIds"
  >,
  context: VidgetSourceContext,
): VidgetSourceDisplay {
  const normalized = normalizeVidgetSource(record);
  if (!normalized) {
    return {
      available: false,
      label: VIDGET_SOURCE_UNAVAILABLE_LABEL,
      sourceType: record.sourceType,
    };
  }

  if (normalized.sourceType === "galaxy") {
    const projectGalaxyId = context.projectGalaxyId?.trim() || null;
    const scopeItems = resolveGalaxyScopeItems(record, context);
    const scopeCount = scopeItems.length;
    const scopeSummary = scopeCount > 0 ? buildScopeSummary(scopeCount) : undefined;
    const scopeAvailable =
      scopeCount > 0 && scopeItems.every((item) => item.available);

    if (
      !projectGalaxyId
      || normalized.galaxyId !== projectGalaxyId
    ) {
      return {
        available: false,
        label: VIDGET_SOURCE_UNAVAILABLE_LABEL,
        sourceType: "galaxy",
        scopeSummary,
        scopeCount,
        scopeItems,
      };
    }
    const name = context.galaxyName?.trim() || null;
    if (!name) {
      return {
        available: false,
        label: VIDGET_SOURCE_UNAVAILABLE_LABEL,
        sourceType: "galaxy",
        scopeSummary,
        scopeCount,
        scopeItems,
      };
    }
    return {
      available: scopeAvailable,
      label: name,
      sourceType: "galaxy",
      scopeSummary,
      scopeCount,
      scopeItems,
    };
  }

  const constellation = context.constellation;
  if (
    !constellation
    || constellation.id !== normalized.constellationId
    || constellation.projectId !== record.projectId
  ) {
    return {
      available: false,
      label: VIDGET_SOURCE_UNAVAILABLE_LABEL,
      sourceType: "constellation",
    };
  }
  const name = constellation.name.trim();
  if (!name) {
    return {
      available: false,
      label: VIDGET_SOURCE_UNAVAILABLE_LABEL,
      sourceType: "constellation",
    };
  }
  return { available: true, label: name, sourceType: "constellation" };
}

export function getVidgetForProject(
  projectId: string,
  vidgetId: string,
  records: VidgetRecord[] = SEED_VIDGETS,
): VidgetRecord | undefined {
  return records.find(
    (item) => item.id === vidgetId && item.projectId === projectId,
  );
}

export function cloneVidget(record: VidgetRecord): VidgetRecord {
  const source = normalizeVidgetSource(record);
  return {
    ...record,
    galaxyId: source?.galaxyId ?? null,
    constellationId: source?.constellationId ?? null,
    galaxyConstellationIds: source?.galaxyConstellationIds ?? [],
    sourceType: source?.sourceType ?? record.sourceType,
  };
}

export function getVidgetsForProject(
  projectId: string,
  records: VidgetRecord[] = SEED_VIDGETS,
): VidgetRecord[] {
  return records
    .filter((item) => item.projectId === projectId)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getVidgetById(
  vidgetId: string,
  records: VidgetRecord[] = SEED_VIDGETS,
): VidgetRecord | undefined {
  return records.find((item) => item.id === vidgetId);
}

export function formatVidgetUpdatedAt(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "Updated recently";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "Updated just now";
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Updated 1 day ago";
  if (days < 14) return `Updated ${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

let vidgetCounter = 0;

export function buildEmptyVidget(input: {
  projectId: string;
  name: string;
  channel: VidgetRecord["channel"];
  sourceType: VidgetRecord["sourceType"];
  galaxyId: string | null;
  constellationId: string | null;
  galaxyConstellationIds?: string[];
}): VidgetRecord {
  const source = normalizeVidgetSource({
    sourceType: input.sourceType,
    galaxyId: input.galaxyId,
    constellationId: input.constellationId,
    galaxyConstellationIds: input.galaxyConstellationIds,
  });
  if (!source || !isValidVidgetSource(source)) {
    throw new Error("Vidget requires a valid source configuration.");
  }
  vidgetCounter += 1;
  const id = `vidget-new-${Date.now()}-${vidgetCounter}`;
  const now = new Date().toISOString();
  return cloneVidget(
    baseVidget({
      id,
      projectId: input.projectId,
      name: input.name.trim() || "Untitled Vidget",
      channel: input.channel,
      sourceType: source.sourceType,
      galaxyId: source.galaxyId,
      constellationId: source.constellationId,
      galaxyConstellationIds: source.galaxyConstellationIds,
      status: "draft",
      updatedAt: now,
    }),
  );
}

export function isVidgetDeploymentActive(
  record: Pick<VidgetRecord, "status" | "channel" | "lastPublishedAt" | "hostedUrl">,
): boolean {
  return (
    record.status === "published"
    && record.channel === "web"
    && record.lastPublishedAt != null
    && record.hostedUrl != null
  );
}

/** Persist draft, activate Web deployment artifacts, and mark published. */
export function applyVidgetWebPublish(record: VidgetRecord): VidgetRecord {
  const now = new Date().toISOString();
  if (record.channel !== "web") {
    return cloneVidget({
      ...record,
      status: "published",
      lastPublishedAt: now,
      updatedAt: now,
      hostedUrl: null,
      embedSnippet: null,
    });
  }
  const deployment = buildVidgetDeploymentFields(record);
  return cloneVidget({
    ...record,
    status: "published",
    lastPublishedAt: now,
    updatedAt: now,
    ...deployment,
  });
}

export function duplicateVidget(source: VidgetRecord): VidgetRecord {
  vidgetCounter += 1;
  const id = `vidget-copy-${Date.now()}-${vidgetCounter}`;
  const now = new Date().toISOString();
  const normalized = cloneVidget(source);
  return cloneVidget({
    ...normalized,
    id,
    name: `${source.name} (copy)`,
    status: "draft",
    updatedAt: now,
    lastPublishedAt: null,
    hostedUrl: null,
    embedSnippet: null,
  });
}

/** Preserve locked intelligence source when saving presentation/config edits. */
export function withLockedVidgetSource(
  draft: VidgetRecord,
  original: VidgetRecord,
): VidgetRecord {
  const source = normalizeVidgetSource(original);
  if (!source) return cloneVidget(draft);
  const nextScope =
    source.sourceType === "galaxy"
      ? normalizeGalaxyConstellationIds(draft.galaxyConstellationIds)
      : [];
  return cloneVidget({
    ...draft,
    projectId: original.projectId,
    sourceType: source.sourceType,
    galaxyId: source.galaxyId,
    constellationId: source.constellationId,
    galaxyConstellationIds: nextScope,
  });
}

export function galaxyConstellationIdsEqual(a: string[], b: string[]): boolean {
  const left = normalizeGalaxyConstellationIds(a);
  const right = normalizeGalaxyConstellationIds(b);
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

/** Prototype: only Web channel has deployable hosted/embed output. */
export function isVidgetChannelDeploymentReady(
  record: Pick<VidgetRecord, "channel">,
): boolean {
  return record.channel === "web";
}

/** Changing channel resets publish state and channel-specific deployment fields. */
export function applyVidgetChannelChange(
  record: VidgetRecord,
  nextChannel: VidgetRecord["channel"],
): VidgetRecord {
  if (record.channel === nextChannel) return cloneVidget(record);
  const next = cloneVidget({
    ...record,
    channel: nextChannel,
    qrEnabled: nextChannel === "web" ? record.qrEnabled : false,
    status: "draft",
    lastPublishedAt: null,
  });
  next.hostedUrl = null;
  next.embedSnippet = null;
  return cloneVidget(next);
}
