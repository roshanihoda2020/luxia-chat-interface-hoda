import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";
import { deriveDatabaseSchemaFromSelection } from "./creationMockData";

export type ConstellationCreationStepId = "basics" | "data" | "review";

export const CONSTELLATION_CREATION_STEPS: {
  id: ConstellationCreationStepId;
  label: string;
}[] = [
  { id: "basics", label: "Basics" },
  { id: "data", label: "Add Data" },
  { id: "review", label: "Review" },
];

export type DataSourceMode = "new" | "existing";

export type DataSourceOwnership = "organizational" | "private";

export type CreationUploadedFile = {
  id: string;
  name: string;
  sizeLabel: string;
  sizeBytes: number;
  status: "ready" | "uploading" | "error";
};

export type ConstellationCreationDraft = {
  projectId: string;
  type: CapsuleConstellationType | null;
  name: string;
  description: string;
  dataSourceMode: DataSourceMode;
  dataSourceName: string;
  ownership: DataSourceOwnership;
  existingDataSourceId: string | null;
  uploadedFiles: CreationUploadedFile[];
  /** Optional schema filter during creation — not required to continue. */
  databaseSchema: string;
  selectedTableIds: string[];
  selectedViewIds: string[];
  instruction: string;
  csvHasHeader: boolean;
  csvDelimiter: string;
  currentStep: ConstellationCreationStepId;
};

export const DEFAULT_INSTRUCTION_BY_TYPE: Record<CapsuleConstellationType, string> = {
  database:
    "Use the connected database data to answer questions accurately and explain important results clearly.",
  pdf:
    "Answer using the uploaded PDF documents and identify when the information is not available.",
  csv:
    "Use the uploaded CSV data for analysis, filtering, and concise summaries.",
};

export function createEmptyConstellationCreationDraft(
  projectId: string,
): ConstellationCreationDraft {
  return {
    projectId,
    type: null,
    name: "",
    description: "",
    dataSourceMode: "new",
    dataSourceName: "",
    ownership: "organizational",
    existingDataSourceId: null,
    uploadedFiles: [],
    databaseSchema: "",
    selectedTableIds: [],
    selectedViewIds: [],
    instruction: "",
    csvHasHeader: true,
    csvDelimiter: ",",
    currentStep: "basics",
  };
}

export function stepIndex(step: ConstellationCreationStepId): number {
  return CONSTELLATION_CREATION_STEPS.findIndex((entry) => entry.id === step);
}

export function hasDraftChanges(
  draft: ConstellationCreationDraft,
  baseline: ConstellationCreationDraft,
): boolean {
  return JSON.stringify(draft) !== JSON.stringify(baseline);
}

export function draftHasTypeSpecificData(draft: ConstellationCreationDraft): boolean {
  if (!draft.type) return false;
  if (draft.type === "database") {
    return (
      draft.dataSourceName.trim().length > 0
      || draft.databaseSchema.trim().length > 0
      || draft.selectedTableIds.length > 0
      || draft.selectedViewIds.length > 0
      || draft.existingDataSourceId !== null
    );
  }
  return draft.dataSourceName.trim().length > 0
    || draft.uploadedFiles.length > 0
    || draft.existingDataSourceId !== null;
}

export function validateConstellationName(
  name: string,
  existingNames: string[],
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a Constellation name.";
  const duplicate = existingNames.some(
    (entry) => entry.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) {
    return "A Constellation with this name already exists in this Project.";
  }
  return null;
}

export function getBasicsFieldErrors(
  draft: ConstellationCreationDraft,
  existingNames: string[],
): { type?: string; name?: string } {
  const errors: { type?: string; name?: string } = {};
  if (!draft.type) {
    errors.type = "Choose a Constellation type.";
  }
  const nameError = validateConstellationName(draft.name, existingNames);
  if (nameError) {
    errors.name = nameError;
  }
  return errors;
}

export function isBasicsComplete(
  draft: ConstellationCreationDraft,
  existingNames: string[],
): boolean {
  return Object.keys(getBasicsFieldErrors(draft, existingNames)).length === 0;
}

export function getDataFieldErrors(
  draft: ConstellationCreationDraft,
): {
  dataSourceName?: string;
  tables?: string;
  files?: string;
  existingSource?: string;
} {
  if (!draft.type) return { dataSourceName: "Choose a Constellation type." };

  if (draft.dataSourceMode === "existing") {
    const errors: { existingSource?: string; tables?: string } = {};
    if (!draft.existingDataSourceId) {
      errors.existingSource = "Select a Data Source.";
    }
    if (draft.type === "database" && draft.selectedTableIds.length === 0) {
      errors.tables = "Select at least one table.";
    }
    return errors;
  }

  const errors: {
    dataSourceName?: string;
    tables?: string;
    files?: string;
  } = {};

  if (!draft.dataSourceName.trim()) {
    errors.dataSourceName = "Enter a Data Source name.";
  }

  if (draft.type === "database") {
    if (draft.selectedTableIds.length === 0) {
      errors.tables = "Select at least one table.";
    }
    return errors;
  }

  if (draft.type === "pdf" && draft.uploadedFiles.length === 0) {
    errors.files = "Upload at least one PDF.";
  } else if (draft.type === "csv" && draft.uploadedFiles.length === 0) {
    errors.files = "Upload at least one CSV.";
  }

  return errors;
}

export function isDataComplete(draft: ConstellationCreationDraft): boolean {
  return Object.keys(getDataFieldErrors(draft)).length === 0;
}

export function isStepComplete(
  draft: ConstellationCreationDraft,
  step: ConstellationCreationStepId,
  existingNames: string[],
): boolean {
  if (step === "basics") return isBasicsComplete(draft, existingNames);
  if (step === "data") return isDataComplete(draft);
  if (step === "review") return getReviewReadiness(draft, existingNames).ready;
  return false;
}

export function getDataStepBlockReason(
  draft: ConstellationCreationDraft,
): string | null {
  const errors = getDataFieldErrors(draft);
  return errors.dataSourceName
    ?? errors.existingSource
    ?? errors.tables
    ?? errors.files
    ?? null;
}

export function getReviewReadiness(
  draft: ConstellationCreationDraft,
  existingNames: string[],
): { ready: boolean; message: string } {
  if (!isBasicsComplete(draft, existingNames)) {
    const basicsErrors = getBasicsFieldErrors(draft, existingNames);
    return {
      ready: false,
      message: basicsErrors.type ?? basicsErrors.name ?? "Complete the basics step.",
    };
  }
  const dataReason = getDataStepBlockReason(draft);
  if (dataReason) {
    return { ready: false, message: dataReason };
  }
  return { ready: true, message: "Ready to create." };
}

export function getContinueBlockReason(
  draft: ConstellationCreationDraft,
  existingNames: string[],
): string | null {
  if (draft.currentStep === "basics") {
    const errors = getBasicsFieldErrors(draft, existingNames);
    return errors.type ?? errors.name ?? null;
  }
  if (draft.currentStep === "data") {
    return getDataStepBlockReason(draft);
  }
  if (draft.currentStep === "review") {
    const readiness = getReviewReadiness(draft, existingNames);
    return readiness.ready ? null : readiness.message;
  }
  return null;
}

/** Schema shown in Review — derived from selected tables, not a manual requirement. */
export function getEffectiveDatabaseSchema(draft: ConstellationCreationDraft): string {
  const derived = deriveDatabaseSchemaFromSelection(draft.selectedTableIds);
  if (derived) return derived;
  return draft.databaseSchema.trim();
}

/** True when instruction is empty or still matches a built-in type default. */
export function isAnyDefaultInstruction(instruction: string): boolean {
  const trimmed = instruction.trim();
  if (!trimmed) return true;
  return (Object.values(DEFAULT_INSTRUCTION_BY_TYPE) as string[]).includes(trimmed);
}

export function resolveInstructionForTypeChange(
  instruction: string,
  nextType: CapsuleConstellationType,
  instructionIsCustom: boolean,
): string {
  if (instructionIsCustom) return instruction;
  return DEFAULT_INSTRUCTION_BY_TYPE[nextType];
}

export function applyTypeDefaults(
  draft: ConstellationCreationDraft,
  type: CapsuleConstellationType,
  options?: { instructionIsCustom?: boolean },
): ConstellationCreationDraft {
  const instructionIsCustom = options?.instructionIsCustom
    ?? !isAnyDefaultInstruction(draft.instruction);
  return {
    ...draft,
    type,
    instruction: resolveInstructionForTypeChange(
      draft.instruction,
      type,
      instructionIsCustom,
    ),
  };
}

export type NewSourceModeSnapshot = {
  dataSourceName: string;
  ownership: DataSourceOwnership;
  uploadedFiles: CreationUploadedFile[];
  databaseSchema: string;
  selectedTableIds: string[];
  selectedViewIds: string[];
  csvHasHeader: boolean;
  csvDelimiter: string;
};

export type ExistingSourceModeSnapshot = {
  existingDataSourceId: string | null;
  selectedTableIds: string[];
  selectedViewIds: string[];
  databaseSchema: string;
};

export function createEmptyNewSourceModeSnapshot(): NewSourceModeSnapshot {
  return {
    dataSourceName: "",
    ownership: "organizational",
    uploadedFiles: [],
    databaseSchema: "",
    selectedTableIds: [],
    selectedViewIds: [],
    csvHasHeader: true,
    csvDelimiter: ",",
  };
}

export function createEmptyExistingSourceModeSnapshot(): ExistingSourceModeSnapshot {
  return {
    existingDataSourceId: null,
    selectedTableIds: [],
    selectedViewIds: [],
    databaseSchema: "",
  };
}

export function snapshotNewSourceModeFromDraft(
  draft: ConstellationCreationDraft,
): NewSourceModeSnapshot {
  return {
    dataSourceName: draft.dataSourceName,
    ownership: draft.ownership,
    uploadedFiles: draft.uploadedFiles,
    databaseSchema: draft.databaseSchema,
    selectedTableIds: draft.selectedTableIds,
    selectedViewIds: draft.selectedViewIds,
    csvHasHeader: draft.csvHasHeader,
    csvDelimiter: draft.csvDelimiter,
  };
}

export function snapshotExistingSourceModeFromDraft(
  draft: ConstellationCreationDraft,
): ExistingSourceModeSnapshot {
  return {
    existingDataSourceId: draft.existingDataSourceId,
    selectedTableIds: draft.selectedTableIds,
    selectedViewIds: draft.selectedViewIds,
    databaseSchema: draft.databaseSchema,
  };
}

export function mergeNewSourceSnapshotIntoDraft(
  draft: ConstellationCreationDraft,
  snapshot: NewSourceModeSnapshot,
): ConstellationCreationDraft {
  return {
    ...draft,
    dataSourceMode: "new",
    dataSourceName: snapshot.dataSourceName,
    ownership: snapshot.ownership,
    uploadedFiles: snapshot.uploadedFiles,
    databaseSchema: snapshot.databaseSchema,
    selectedTableIds: snapshot.selectedTableIds,
    selectedViewIds: snapshot.selectedViewIds,
    csvHasHeader: snapshot.csvHasHeader,
    csvDelimiter: snapshot.csvDelimiter,
    existingDataSourceId: null,
  };
}

export function mergeExistingSourceSnapshotIntoDraft(
  draft: ConstellationCreationDraft,
  snapshot: ExistingSourceModeSnapshot,
): ConstellationCreationDraft {
  return {
    ...draft,
    dataSourceMode: "existing",
    existingDataSourceId: snapshot.existingDataSourceId,
    selectedTableIds: snapshot.selectedTableIds,
    selectedViewIds: snapshot.selectedViewIds,
    databaseSchema: snapshot.databaseSchema,
    dataSourceName: "",
    uploadedFiles: [],
  };
}

export function switchDataSourceModeInDraft(
  draft: ConstellationCreationDraft,
  mode: DataSourceMode,
  caches: {
    newSource: NewSourceModeSnapshot;
    existingSource: ExistingSourceModeSnapshot;
  },
): {
  draft: ConstellationCreationDraft;
  caches: {
    newSource: NewSourceModeSnapshot;
    existingSource: ExistingSourceModeSnapshot;
  };
} {
  const nextCaches = { ...caches };
  if (draft.dataSourceMode === "new") {
    nextCaches.newSource = snapshotNewSourceModeFromDraft(draft);
  } else {
    nextCaches.existingSource = snapshotExistingSourceModeFromDraft(draft);
  }

  const nextDraft = mode === "new"
    ? mergeNewSourceSnapshotIntoDraft(draft, nextCaches.newSource)
    : mergeExistingSourceSnapshotIntoDraft(draft, nextCaches.existingSource);

  return { draft: nextDraft, caches: nextCaches };
}

export function findDuplicateUpload(
  files: readonly CreationUploadedFile[],
  file: File,
): CreationUploadedFile | undefined {
  return files.find(
    (entry) => entry.name === file.name && entry.sizeBytes === file.size,
  );
}

export function appendUploadedFile(
  files: readonly CreationUploadedFile[],
  file: File,
  sizeLabel: string,
): { files: CreationUploadedFile[]; duplicate: boolean } {
  if (findDuplicateUpload(files, file)) {
    return { files: [...files], duplicate: true };
  }
  const id = `upload-${encodeURIComponent(file.name)}-${file.size}`;
  return {
    files: [
      ...files,
      {
        id,
        name: file.name,
        sizeLabel,
        sizeBytes: file.size,
        status: "ready",
      },
    ],
    duplicate: false,
  };
}

export function clearTypeSpecificData(
  draft: ConstellationCreationDraft,
): ConstellationCreationDraft {
  return {
    ...draft,
    dataSourceMode: "new",
    dataSourceName: "",
    ownership: "organizational",
    existingDataSourceId: null,
    uploadedFiles: [],
    databaseSchema: "",
    selectedTableIds: [],
    selectedViewIds: [],
    csvHasHeader: true,
    csvDelimiter: ",",
  };
}

export function ensureInstructionDefault(
  draft: ConstellationCreationDraft,
  instructionIsCustom = false,
): ConstellationCreationDraft {
  if (!draft.type || instructionIsCustom || draft.instruction.trim()) return draft;
  return {
    ...draft,
    instruction: DEFAULT_INSTRUCTION_BY_TYPE[draft.type],
  };
}
