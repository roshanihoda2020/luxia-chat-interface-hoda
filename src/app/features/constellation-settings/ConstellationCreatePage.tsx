import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronLeft,
  FileSpreadsheet,
  FileText,
  Pencil,
  Search,
  Table2,
  Upload,
  X,
} from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Textarea } from "@/app/components/ui/textarea";
import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";
import {
  ACCESS_LEVELS,
  DATA_SOURCE_CATALOG,
  formatDataSourceType,
  getDataSourceOwnerDisplay,
  listAccessibleDataSources,
  ORGANIZATIONAL_MANAGED_LABEL,
  isDataSourceUsable,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";
import { CURRENT_USER_ID } from "@/app/features/permissions/currentUser";
import { formatFileSize } from "@/app/features/pdf-files/utils";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { constellationTypeLabel } from "./types";
import {
  CONSTELLATION_CREATION_STEPS,
  appendUploadedFile,
  applyTypeDefaults,
  clearTypeSpecificData,
  createEmptyConstellationCreationDraft,
  createEmptyExistingSourceModeSnapshot,
  createEmptyNewSourceModeSnapshot,
  draftHasTypeSpecificData,
  ensureInstructionDefault,
  getBasicsFieldErrors,
  getDataFieldErrors,
  getDataStepBlockReason,
  getReviewReadiness,
  hasDraftChanges,
  isStepComplete,
  stepIndex,
  switchDataSourceModeInDraft,
  type ConstellationCreationDraft,
  type ConstellationCreationStepId,
  type CreationUploadedFile,
  type ExistingSourceModeSnapshot,
  type NewSourceModeSnapshot,
} from "./constellationCreateDraft";
import {
  buildReviewAddedDataSummary,
} from "./constellationCreatePayload";
import {
  CREATION_DATABASE_TABLES,
  CREATION_DATABASE_VIEWS,
  deriveDatabaseSchemaFromSelection,
  getCreationDatabaseSchemas,
} from "./creationMockData";
import { CONSTELLATION_SETTINGS_PAGE_VARIANT } from "./ia";

const CONTENT_CLASS = "w-full min-w-0";

const TYPE_OPTIONS: {
  id: CapsuleConstellationType;
  label: string;
  description: string;
  icon: typeof Table2;
}[] = [
  {
    id: "database",
    label: "Database",
    description: "Use structured database tables for queries and analysis.",
    icon: Table2,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Use PDF documents as searchable knowledge.",
    icon: FileText,
  },
  {
    id: "csv",
    label: "CSV",
    description: "Use CSV files for structured analysis and lookup.",
    icon: FileSpreadsheet,
  },
];

function sourcesForType(
  type: CapsuleConstellationType,
  accessLevels: AccessLevelRecord[],
  userId: string,
  dataSources: DataSourceCatalogItem[],
): DataSourceCatalogItem[] {
  const accessible = listAccessibleDataSources(
    accessLevels,
    dataSources,
    userId,
  );
  return accessible.filter((source) => {
    const normalized = source.type.toLowerCase();
    if (type === "database") return normalized.includes("database");
    if (type === "csv") return normalized.includes("csv");
    return normalized.includes("pdf") || normalized.includes("file");
  });
}

function filteredTables(schema: string, query: string) {
  const schemaFilter = schema.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  return CREATION_DATABASE_TABLES.filter((table) => {
    if (schemaFilter && table.schema.toLowerCase() !== schemaFilter) return false;
    if (!q) return true;
    return table.name.toLowerCase().includes(q) || table.schema.toLowerCase().includes(q);
  });
}

function filteredViews(schema: string) {
  const trimmed = schema.trim().toLowerCase();
  if (!trimmed) return CREATION_DATABASE_VIEWS;
  return CREATION_DATABASE_VIEWS.filter(
    (view) => view.schema.toLowerCase() === trimmed,
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="luxia-type-metadata"
      role="alert"
      style={{ color: "var(--luxia-error)" }}
    >
      {message}
    </p>
  );
}

function CreationFileUpload({
  accept,
  acceptLabel,
  files,
  onAdd,
  onRemove,
  error,
}: {
  accept: string;
  acceptLabel: string;
  files: CreationUploadedFile[];
  onAdd: (file: File) => "added" | "duplicate" | "invalid";
  onRemove: (fileId: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  function validateAndAdd(file: File | null) {
    setLocalError(null);
    setDuplicateNotice(null);
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = accept.split(",").map((item) => item.trim().toLowerCase());
    if (!allowed.some((item) => item === extension || file.type === item)) {
      setLocalError(`Only ${acceptLabel} files are supported.`);
      return;
    }
    const result = onAdd(file);
    if (result === "duplicate") {
      setDuplicateNotice(`${file.name} is already in the list.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayError = error ?? localError;

  return (
    <div className="luxia-creation-stack-tight">
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={inputId}
        className={`luxia-creation-upload${dragOver ? " is-dragover" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          Array.from(event.dataTransfer.files ?? []).forEach((file) => validateAndAdd(file));
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <Upload size={20} className="luxia-creation-upload-icon" aria-hidden />
        <p id={inputId} className="luxia-type-body-dense-strong luxia-creation-upload-title">
          Drag and drop files here or{" "}
          <span className="luxia-creation-upload-browse">Browse files</span>
        </p>
        <p className="luxia-type-caption luxia-creation-upload-hint">
          {acceptLabel} only · at least one file required
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple
          onChange={(event) => {
            Array.from(event.target.files ?? []).forEach((file) => validateAndAdd(file));
          }}
        />
      </div>

      <FieldError message={displayError ?? undefined} />
      {duplicateNotice ? (
        <p className="luxia-type-caption text-[var(--luxia-text-secondary)]" role="status">
          {duplicateNotice}
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="luxia-creation-stack-tight">
          <p className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
          <ul className="space-y-1.5" aria-label="Selected files">
            {files.map((file) => (
              <li key={file.id} className="luxia-creation-file-row">
                <div className="min-w-0 flex-1">
                  <p className="truncate luxia-type-body-dense text-[var(--luxia-text-primary)]">
                    {file.name}
                  </p>
                  <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
                    {file.sizeLabel}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(file.id)}
                >
                  <X size={14} aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DataSourceModeSelector({
  mode,
  onChange,
  allowExisting,
}: {
  mode: ConstellationCreationDraft["dataSourceMode"];
  onChange: (mode: ConstellationCreationDraft["dataSourceMode"]) => void;
  allowExisting: boolean;
}) {
  return (
    <div className="luxia-creation-stack-tight">
      <Label className="luxia-type-body-dense-strong">Data Source</Label>
      <div
        className="luxia-creation-mode-selector"
        role="radiogroup"
        aria-label="Data Source mode"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "new"}
          className={`luxia-creation-mode-option${mode === "new" ? " is-selected" : ""}`}
          onClick={() => onChange("new")}
        >
          Add new Data Source
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "existing"}
          disabled={!allowExisting}
          className={`luxia-creation-mode-option${mode === "existing" ? " is-selected" : ""}`}
          onClick={() => allowExisting && onChange("existing")}
        >
          Use existing Data Source
        </button>
      </div>
      <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
        {mode === "new"
          ? "Create and connect a new Data Source for this Constellation."
          : "Connect an existing compatible Data Source to this Constellation."}
      </p>
    </div>
  );
}

function OwnershipRadioList({
  value,
  onChange,
}: {
  value: ConstellationCreationDraft["ownership"];
  onChange: (value: ConstellationCreationDraft["ownership"]) => void;
}) {
  return (
    <fieldset className="luxia-creation-ownership-fieldset min-w-0 border-0 p-0">
      <legend className="mb-2 luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
        Ownership
      </legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(next as ConstellationCreationDraft["ownership"])}
        className="luxia-creation-ownership-list flex flex-col gap-0"
        aria-label="Ownership"
      >
        <label
          className={`luxia-creation-ownership-row${value === "organizational" ? " is-selected" : ""}`}
          htmlFor="ownership-org"
        >
          <RadioGroupItem
            value="organizational"
            id="ownership-org"
            aria-describedby="ownership-org-desc"
            className="luxia-creation-ownership-row-radio shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="luxia-creation-ownership-row-title">Organizational</span>
            <p id="ownership-org-desc" className="luxia-creation-ownership-row-desc">
              Access is managed through Access Levels.
            </p>
          </span>
        </label>
        <div className="luxia-creation-ownership-divider" role="presentation" />
        <label
          className={`luxia-creation-ownership-row${value === "private" ? " is-selected" : ""}`}
          htmlFor="ownership-private"
        >
          <RadioGroupItem
            value="private"
            id="ownership-private"
            aria-describedby="ownership-private-desc"
            className="luxia-creation-ownership-row-radio shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="luxia-creation-ownership-row-title">Private</span>
            <p id="ownership-private-desc" className="luxia-creation-ownership-row-desc">
              Owned by you initially and shareable later.
            </p>
          </span>
        </label>
      </RadioGroup>
    </fieldset>
  );
}

function ExistingSourceOwnershipMeta({
  ownership,
}: {
  ownership: DataSourceCatalogItem["ownership"];
}) {
  const label = ownership === "private" ? "Private" : "Organizational";
  return (
    <div className="luxia-creation-ownership-readonly">
      <p className="luxia-creation-ownership-readonly-label">Ownership</p>
      <p className="luxia-creation-ownership-readonly-value">{label}</p>
      <p className="luxia-creation-ownership-readonly-hint">
        Inherited from the selected Data Source
      </p>
    </div>
  );
}

function ownershipLabelFromDraft(
  draft: ConstellationCreationDraft,
  sources: DataSourceCatalogItem[],
): "Private" | "Organizational" {
  if (draft.dataSourceMode === "existing" && draft.existingDataSourceId) {
    const source = sources.find((item) => item.id === draft.existingDataSourceId);
    if (source) {
      return source.ownership === "private" ? "Private" : "Organizational";
    }
  }
  return draft.ownership === "private" ? "Private" : "Organizational";
}

function renderNewSourceNameField({
  id,
  value,
  error,
  onChange,
}: {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="luxia-creation-stack-tight">
      <Label htmlFor={id}>Data Source name</Label>
      <Input
        id={id}
        value={value}
        placeholder="Data source name 01"
        aria-required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function StepProgress({
  currentStep,
  onGoToStep,
  draft,
  existingNames,
}: {
  currentStep: ConstellationCreationStepId;
  onGoToStep: (step: ConstellationCreationStepId) => void;
  draft: ConstellationCreationDraft;
  existingNames: string[];
}) {
  const currentIndex = stepIndex(currentStep);
  const currentLabel = CONSTELLATION_CREATION_STEPS[currentIndex]?.label ?? "Basics";
  const progressPct = ((currentIndex + 1) / CONSTELLATION_CREATION_STEPS.length) * 100;

  return (
    <nav aria-label="Constellation creation progress" className="luxia-creation-stage-header">
      <div className="luxia-creation-stage-mobile">
        <p className="luxia-type-caption luxia-creation-stage-mobile-count">
          Step {currentIndex + 1} of {CONSTELLATION_CREATION_STEPS.length}
        </p>
        <p className="luxia-type-body-dense-strong luxia-creation-stage-mobile-name">
          {currentLabel}
        </p>
        <div
          className="luxia-creation-progress-bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={CONSTELLATION_CREATION_STEPS.length}
          aria-valuenow={currentIndex + 1}
          aria-label={`Step ${currentIndex + 1} of ${CONSTELLATION_CREATION_STEPS.length}`}
        >
          <div className="luxia-creation-progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="luxia-creation-stage-desktop">
        <ol className="luxia-creation-stage-milestones">
          {CONSTELLATION_CREATION_STEPS.map((step, index) => {
            const complete = isStepComplete(draft, step.id, existingNames);
            const current = step.id === currentStep;
            const completed = complete && !current;
            const clickable = completed;

            return (
              <li key={step.id} className="inline-flex items-center">
                {index > 0 ? (
                  <span
                    className={`luxia-creation-stage-connector${
                      index <= currentIndex ? " is-filled" : ""
                    }`}
                    aria-hidden
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!clickable}
                  aria-current={current ? "step" : undefined}
                  className={[
                    "luxia-creation-stage-milestone",
                    current ? "is-current" : "",
                    completed ? "is-completed" : "",
                    clickable ? "is-clickable" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => clickable && onGoToStep(step.id)}
                >
                  <span className="luxia-creation-stage-marker" aria-hidden>
                    {completed ? <Check size={8} strokeWidth={2.5} /> : null}
                  </span>
                  <span className="luxia-type-body-dense luxia-creation-stage-label">
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="luxia-type-caption luxia-creation-stage-meta">
          Step {currentIndex + 1} of {CONSTELLATION_CREATION_STEPS.length}
        </p>
      </div>
    </nav>
  );
}

function CreationActionBar({
  showPreviousStep,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onCancel,
  onPreviousStep,
  sticky = false,
}: {
  showPreviousStep: boolean;
  primaryLabel: string;
  primaryDisabled: boolean;
  onPrimary: () => void;
  onCancel: () => void;
  onPreviousStep: () => void;
  sticky?: boolean;
}) {
  return (
    <div className={`luxia-creation-action-bar${sticky ? " is-sticky" : ""}`}>
      <div className="luxia-creation-action-bar-row">
        <div className="min-w-0">
          {showPreviousStep ? (
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              aria-label="Previous step"
              onClick={onPreviousStep}
            >
              <ChevronLeft size={14} aria-hidden className="mr-1 shrink-0" />
              Previous step
            </Button>
          ) : null}
        </div>
        <div className="luxia-creation-action-bar-right">
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>
          <Button type="button" variant="secondary" size="compact" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export type ConstellationCreateNavigationGuard = {
  isDirty: () => boolean;
  requestLeaveConfirmation: (onConfirmed: () => void) => void;
};

export interface ConstellationCreatePageProps {
  projectId: string;
  projectName: string;
  existingConstellationNames: string[];
  unavailable?: boolean;
  accessLevels?: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
  currentUserId?: string;
  navigationGuardRef?: MutableRefObject<ConstellationCreateNavigationGuard | null>;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onCancel: (projectId: string) => void;
  onCreate: (draft: ConstellationCreationDraft) => void;
}

export function ConstellationCreatePage({
  projectId,
  projectName,
  existingConstellationNames,
  unavailable = false,
  accessLevels = ACCESS_LEVELS,
  dataSources = DATA_SOURCE_CATALOG,
  currentUserId = CURRENT_USER_ID,
  navigationGuardRef,
  onNavigateHome,
  onOpenProject,
  onCancel,
  onCreate,
}: ConstellationCreatePageProps) {
  const baselineRef = useRef(createEmptyConstellationCreationDraft(projectId));
  const draftRef = useRef<ConstellationCreationDraft>(
    createEmptyConstellationCreationDraft(projectId),
  );
  const [draft, setDraft] = useState<ConstellationCreationDraft>(() =>
    createEmptyConstellationCreationDraft(projectId),
  );
  const [basicsAttempted, setBasicsAttempted] = useState(false);
  const [dataAttempted, setDataAttempted] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingType, setPendingType] = useState<CapsuleConstellationType | null>(null);
  const [editingInstruction, setEditingInstruction] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const instructionIsCustomRef = useRef(false);
  const newSourceSnapshotRef = useRef<NewSourceModeSnapshot>(
    createEmptyNewSourceModeSnapshot(),
  );
  const existingSourceSnapshotRef = useRef<ExistingSourceModeSnapshot>(
    createEmptyExistingSourceModeSnapshot(),
  );
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const projectIdRef = useRef(projectId);

  draftRef.current = draft;

  useEffect(() => {
    if (projectIdRef.current === projectId) return;
    projectIdRef.current = projectId;
    const empty = createEmptyConstellationCreationDraft(projectId);
    baselineRef.current = empty;
    draftRef.current = empty;
    setDraft(empty);
    setBasicsAttempted(false);
    setDataAttempted(false);
    setShowDiscardDialog(false);
    setPendingType(null);
    setEditingInstruction(false);
    setTableSearch("");
    setIsCreating(false);
    instructionIsCustomRef.current = false;
    newSourceSnapshotRef.current = createEmptyNewSourceModeSnapshot();
    existingSourceSnapshotRef.current = createEmptyExistingSourceModeSnapshot();
    pendingNavigationRef.current = null;
  }, [projectId]);

  useEffect(() => {
    if (!navigationGuardRef) return;
    navigationGuardRef.current = {
      isDirty: () => hasDraftChanges(draftRef.current, baselineRef.current),
      requestLeaveConfirmation: (onConfirmed) => {
        pendingNavigationRef.current = onConfirmed;
        setShowDiscardDialog(true);
      },
    };
    return () => {
      navigationGuardRef.current = null;
    };
  }, [navigationGuardRef]);

  const dirty = useMemo(
    () => hasDraftChanges(draft, baselineRef.current),
    [draft],
  );

  const basicsErrors = useMemo(
    () => getBasicsFieldErrors(draft, existingConstellationNames),
    [draft, existingConstellationNames],
  );

  const dataErrors = useMemo(
    () => getDataFieldErrors(draft),
    [draft],
  );

  const visibleBasicsErrors = basicsAttempted ? basicsErrors : {};
  const visibleDataErrors = dataAttempted ? dataErrors : {};

  const readiness = useMemo(
    () => getReviewReadiness(draft, existingConstellationNames),
    [draft, existingConstellationNames],
  );

  const breadcrumbItems: LuxiaBreadcrumbItem[] = useMemo(
    () => [
      { id: "home", label: "Home", destination: { kind: "home" } },
      {
        id: `project-${projectId}`,
        label: projectName,
        destination: { kind: "project", projectId },
      },
      {
        id: "create-constellation",
        label: "Create Constellation",
        destination: { kind: "current" },
      },
    ],
    [projectId, projectName],
  );

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = useMemo(
    () => ({
      onHome: onNavigateHome,
      onProject: () => onOpenProject(projectId),
    }),
    [onNavigateHome, onOpenProject, projectId],
  );

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [draft.currentStep]);

  const goToStep = useCallback((step: ConstellationCreationStepId) => {
    setDraft((prev) => ({ ...prev, currentStep: step }));
    setEditingInstruction(false);
  }, []);

  const goNext = useCallback(() => {
    const current = draftRef.current;
    if (current.currentStep === "basics") {
      setBasicsAttempted(true);
      const errors = getBasicsFieldErrors(current, existingConstellationNames);
      if (Object.keys(errors).length > 0) return;
      setDraft((prev) => ensureInstructionDefault(prev, instructionIsCustomRef.current));
      goToStep("data");
      return;
    }
    if (current.currentStep === "data") {
      setDataAttempted(true);
      if (getDataStepBlockReason(current)) return;
      setDraft((prev) => ensureInstructionDefault(prev, instructionIsCustomRef.current));
      goToStep("review");
    }
  }, [existingConstellationNames, goToStep]);

  const goPreviousStep = useCallback(() => {
    const prev = CONSTELLATION_CREATION_STEPS[stepIndex(draft.currentStep) - 1];
    if (prev) goToStep(prev.id);
  }, [draft.currentStep, goToStep]);

  const requestLeaveCreation = useCallback(() => {
    if (dirty) {
      setShowDiscardDialog(true);
      return;
    }
    onCancel(projectId);
  }, [dirty, onCancel, projectId]);

  const handleCancel = useCallback(() => {
    requestLeaveCreation();
  }, [requestLeaveCreation]);

  const handleCreate = useCallback(() => {
    if (isCreating) return;
    const current = draftRef.current;
    const readinessNow = getReviewReadiness(current, existingConstellationNames);
    if (!readinessNow.ready) return;
    if (!current.projectId || !current.type) return;
    setIsCreating(true);
    onCreate(ensureInstructionDefault(
      { ...current, name: current.name.trim() },
      instructionIsCustomRef.current,
    ));
  }, [existingConstellationNames, isCreating, onCreate]);

  const resetModeSnapshots = useCallback(() => {
    newSourceSnapshotRef.current = createEmptyNewSourceModeSnapshot();
    existingSourceSnapshotRef.current = createEmptyExistingSourceModeSnapshot();
  }, []);

  const applyTypeChange = useCallback(
    (type: CapsuleConstellationType) => {
      const instructionIsCustom = instructionIsCustomRef.current;
      setDraft((prev) =>
        applyTypeDefaults(
          clearTypeSpecificData({ ...prev, type }),
          type,
          { instructionIsCustom },
        ),
      );
      resetModeSnapshots();
      setBasicsAttempted(false);
      setDataAttempted(false);
    },
    [resetModeSnapshots],
  );

  const handleTypeSelect = useCallback(
    (type: CapsuleConstellationType) => {
      if (draft.type === type) return;
      if (draft.type && draftHasTypeSpecificData(draft)) {
        setPendingType(type);
        return;
      }
      applyTypeChange(type);
    },
    [applyTypeChange, draft],
  );

  const confirmTypeChange = useCallback(() => {
    if (!pendingType) return;
    applyTypeChange(pendingType);
    setPendingType(null);
  }, [applyTypeChange, pendingType]);

  const updateDraft = useCallback(
    (patch: Partial<ConstellationCreationDraft>) => {
      setDraft((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const switchDataSourceMode = useCallback(
    (mode: ConstellationCreationDraft["dataSourceMode"]) => {
      setDataAttempted(false);
      setDraft((prev) => {
        const caches = {
          newSource: newSourceSnapshotRef.current,
          existingSource: existingSourceSnapshotRef.current,
        };
        const result = switchDataSourceModeInDraft(prev, mode, caches);
        newSourceSnapshotRef.current = result.caches.newSource;
        existingSourceSnapshotRef.current = result.caches.existingSource;
        return result.draft;
      });
    },
    [],
  );

  const addUploadedFile = useCallback((file: File): "added" | "duplicate" | "invalid" => {
    let outcome: "added" | "duplicate" = "added";
    setDraft((prev) => {
      const next = appendUploadedFile(
        prev.uploadedFiles,
        file,
        formatFileSize(file.size),
      );
      outcome = next.duplicate ? "duplicate" : "added";
      return { ...prev, uploadedFiles: next.files };
    });
    return outcome;
  }, []);

  const removeUploadedFile = useCallback((fileId: string) => {
    setDraft((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((file) => file.id !== fileId),
    }));
  }, []);

  const toggleTable = useCallback((tableId: string) => {
    setDraft((prev) => {
      const isSelected = prev.selectedTableIds.includes(tableId);
      const nextTableIds = isSelected
        ? prev.selectedTableIds.filter((id) => id !== tableId)
        : [...prev.selectedTableIds, tableId];

      let nextSchema = prev.databaseSchema;
      if (!isSelected && !prev.databaseSchema.trim()) {
        const table = CREATION_DATABASE_TABLES.find((item) => item.id === tableId);
        if (table) nextSchema = table.schema;
      }

      return {
        ...prev,
        selectedTableIds: nextTableIds,
        databaseSchema: nextSchema,
      };
    });
  }, []);

  const toggleView = useCallback((viewId: string) => {
    setDraft((prev) => ({
      ...prev,
      selectedViewIds: prev.selectedViewIds.includes(viewId)
        ? prev.selectedViewIds.filter((id) => id !== viewId)
        : [...prev.selectedViewIds, viewId],
    }));
  }, []);

  const isFinalStep = draft.currentStep === "review";
  const primaryLabel = isFinalStep ? "Create Constellation" : "Continue";
  const primaryDisabled = unavailable
    || isCreating
    || (isFinalStep && !readiness.ready);
  const currentStepLabel =
    CONSTELLATION_CREATION_STEPS[stepIndex(draft.currentStep)]?.label ?? "Basics";

  function confirmDiscardNavigation() {
    const proceed = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowDiscardDialog(false);
    if (proceed) {
      proceed();
      return;
    }
    onCancel(projectId);
  }

  const availableSources = draft.type
    ? sourcesForType(draft.type, accessLevels, currentUserId, dataSources)
    : [];
  const schemaOptions = getCreationDatabaseSchemas();
  const tables = filteredTables(draft.databaseSchema, tableSearch);
  const views = filteredViews(draft.databaseSchema);
  const allTablesInSchema = filteredTables(draft.databaseSchema, "");
  const allSelected = allTablesInSchema.length > 0
    && allTablesInSchema.every((table) => draft.selectedTableIds.includes(table.id));

  if (unavailable) {
    return (
      <LuxiaPageFrame variant="standard">
        <LuxiaPageHeader
          pageTypeLabel="CONSTELLATION"
          title="Create Constellation"
          breadcrumb={<LuxiaBreadcrumb items={breadcrumbItems} handlers={breadcrumbHandlers} />}
          context={
            <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
              This Project is unavailable. Return to Home to continue.
            </p>
          }
          secondaryAction={
            <Button type="button" variant="secondary" size="compact" onClick={onNavigateHome}>
              Go to Home
            </Button>
          }
        />
      </LuxiaPageFrame>
    );
  }

  function renderBasicsStep() {
    return (
      <div className={CONTENT_CLASS}>
        <div className="luxia-creation-stack">
          <div className="luxia-creation-stack-tight">
            <Label className="luxia-type-body-dense-strong">Constellation type</Label>
            <div
              className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Constellation type"
              aria-describedby={visibleBasicsErrors.type ? "constellation-type-error" : undefined}
            >
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = draft.type === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`luxia-creation-option${selected ? " is-selected" : ""}`}
                    onClick={() => handleTypeSelect(option.id)}
                  >
                    {selected ? (
                      <span className="luxia-creation-option-check" aria-hidden>
                        <Check size={12} strokeWidth={2.5} />
                      </span>
                    ) : null}
                    <Icon size={20} className="luxia-creation-option-icon" aria-hidden />
                    <div>
                      <p className="luxia-type-body-dense-strong luxia-creation-option-title">
                        {option.label}
                      </p>
                      <p className="mt-1 luxia-type-body-small luxia-creation-option-desc">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <FieldError id="constellation-type-error" message={visibleBasicsErrors.type} />
          </div>

          <div className="luxia-creation-stack-tight">
            <Label htmlFor="constellation-name">Constellation name</Label>
            <Input
              id="constellation-name"
              value={draft.name}
              placeholder="Constellation name 01"
              aria-required
              aria-invalid={Boolean(visibleBasicsErrors.name)}
              aria-describedby={visibleBasicsErrors.name ? "constellation-name-error" : undefined}
              onChange={(event) => updateDraft({ name: event.target.value })}
            />
            <FieldError id="constellation-name-error" message={visibleBasicsErrors.name} />
          </div>

          <div className="luxia-creation-stack-tight">
            <Label htmlFor="constellation-description">
              Description
              <span className="ml-1 font-normal text-[var(--luxia-text-muted)]">
                (optional)
              </span>
            </Label>
            <Textarea
              id="constellation-description"
              value={draft.description}
              placeholder="Optional description for this Constellation."
              rows={2}
              onChange={(event) => updateDraft({ description: event.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderExistingSourcePicker() {
    return (
      <div className="luxia-creation-stack-tight">
        <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
          Only compatible {draft.type ? constellationTypeLabel(draft.type) : ""} sources are shown.
        </p>
        <ul className="space-y-2" role="radiogroup" aria-label="Existing Data Source">
          {availableSources.map((source) => {
            const usable = isDataSourceUsable(source.status);
            const selected = draft.existingDataSourceId === source.id;
            const ownershipLabel = source.ownership === "private" ? "Private" : "Organizational";
            const statusLabel = source.status === "active"
              ? "Active"
              : source.status === "archived"
                ? "Archived"
                : "Inactive";
            const metaParts = [
              formatDataSourceType(source.type),
              ownershipLabel,
              source.ownership === "private"
                ? `Owner: ${getDataSourceOwnerDisplay(source)}`
                : `Managed by: ${ORGANIZATIONAL_MANAGED_LABEL}`,
              statusLabel,
            ].filter(Boolean);

            return (
              <li key={source.id}>
                <label
                  className={[
                    "luxia-creation-data-row",
                    usable ? "cursor-pointer" : "is-unavailable",
                    selected ? "is-selected" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <input
                    type="radio"
                    name="existing-data-source"
                    className="mt-1"
                    disabled={!usable}
                    checked={selected}
                    onChange={() => updateDraft({ existingDataSourceId: source.id })}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="luxia-type-body-dense-strong luxia-creation-data-name">
                      {source.name}
                    </p>
                    <p className="luxia-type-caption luxia-creation-data-meta">
                      {metaParts.join(" · ")}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
        <FieldError
          id="existing-data-source-error"
          message={visibleDataErrors.existingSource}
        />
        {draft.existingDataSourceId ? (() => {
          const selected = availableSources.find(
            (source) => source.id === draft.existingDataSourceId,
          );
          if (!selected) return null;
          return <ExistingSourceOwnershipMeta ownership={selected.ownership} />;
        })() : null}
      </div>
    );
  }

  function renderSchemaFilter() {
    const derivedSchema = deriveDatabaseSchemaFromSelection(draft.selectedTableIds);
    return (
      <div className="luxia-creation-stack-tight">
        <Label htmlFor="schema-filter">
          Schema
          <span className="ml-1 font-normal text-[var(--luxia-text-muted)]">(optional filter)</span>
        </Label>
        <select
          id="schema-filter"
          className="luxia-creation-select"
          value={draft.databaseSchema}
          onChange={(event) => updateDraft({ databaseSchema: event.target.value })}
        >
          <option value="">All schemas</option>
          {schemaOptions.map((schema) => (
            <option key={schema} value={schema}>
              {schema}
            </option>
          ))}
        </select>
        {derivedSchema ? (
          <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
            Selected tables use schema: {derivedSchema}
          </p>
        ) : null}
      </div>
    );
  }

  function renderDatabaseTablesViews() {
    return (
      <>
        {renderSchemaFilter()}

        <div className="luxia-creation-stack-tight min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Tables</Label>
            <span className="luxia-type-caption text-[var(--luxia-text-secondary)]">
              {draft.selectedTableIds.length} selected
            </span>
          </div>
          {CREATION_DATABASE_TABLES.length > 5 ? (
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--luxia-text-secondary)]"
                aria-hidden
              />
              <Input
                value={tableSearch}
                onChange={(event) => setTableSearch(event.target.value)}
                placeholder="Search tables"
                className="h-9 pl-9"
                aria-label="Search tables"
              />
            </div>
          ) : null}
          {allTablesInSchema.length > 1 ? (
            <Button
              type="button"
              variant="tertiary"
              size="compact"
              onClick={() => {
                if (allSelected) {
                  updateDraft({ selectedTableIds: [] });
                  return;
                }
                updateDraft({
                  selectedTableIds: allTablesInSchema.map((table) => table.id),
                  databaseSchema: draft.databaseSchema || allTablesInSchema[0]?.schema || "",
                });
              }}
            >
              {allSelected ? "Clear selection" : "Select all"}
            </Button>
          ) : null}
          <div className="luxia-creation-list-panel">
            <ul className="luxia-creation-list-scroll luxia-scrollbar luxia-scrollbar-vertical space-y-0.5">
              {tables.map((table) => {
                const selected = draft.selectedTableIds.includes(table.id);
                return (
                  <li
                    key={table.id}
                    className={`luxia-creation-list-row${selected ? " is-selected" : ""}`}
                  >
                    <Checkbox
                      id={`table-${table.id}`}
                      checked={selected}
                      onCheckedChange={() => toggleTable(table.id)}
                    />
                    <label htmlFor={`table-${table.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                        {table.name}
                      </span>
                      <span className="luxia-type-caption ml-2 text-[var(--luxia-text-secondary)]">
                        {table.schema}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <FieldError id="database-tables-error" message={visibleDataErrors.tables} />
        </div>

        {views.length > 0 ? (
          <details className="luxia-creation-views-disclosure">
            <summary className="luxia-creation-views-summary">
              Add database views
              <span className="luxia-creation-views-optional">(optional)</span>
            </summary>
            <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
              Include database views when they contain useful prepared data.
            </p>
            <div className="luxia-creation-list-panel mt-2">
              <ul className="luxia-creation-list-scroll is-views luxia-scrollbar luxia-scrollbar-vertical space-y-0.5">
                {views.map((view) => {
                  const selected = draft.selectedViewIds.includes(view.id);
                  return (
                    <li
                      key={view.id}
                      className={`luxia-creation-list-row${selected ? " is-selected" : ""}`}
                    >
                      <Checkbox
                        id={`view-${view.id}`}
                        checked={selected}
                        onCheckedChange={() => toggleView(view.id)}
                      />
                      <label
                        htmlFor={`view-${view.id}`}
                        className="cursor-pointer luxia-type-body-dense text-[var(--luxia-text-primary)]"
                      >
                        {view.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        ) : null}
      </>
    );
  }

  function renderDatabaseDataStep() {
    return (
      <div className={CONTENT_CLASS}>
        <div className="luxia-creation-stack">
          <DataSourceModeSelector
            mode={draft.dataSourceMode}
            onChange={switchDataSourceMode}
            allowExisting={availableSources.length > 0}
          />

          {draft.dataSourceMode === "existing" ? (
            <>
              {renderExistingSourcePicker()}
              {draft.existingDataSourceId ? renderDatabaseTablesViews() : null}
            </>
          ) : (
            <>
              {renderNewSourceNameField({
                id: "ds-name-db",
                value: draft.dataSourceName,
                error: visibleDataErrors.dataSourceName,
                onChange: (dataSourceName) => updateDraft({ dataSourceName }),
              })}
              <OwnershipRadioList
                value={draft.ownership}
                onChange={(ownership) => updateDraft({ ownership })}
              />
              {renderDatabaseTablesViews()}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderPdfDataStep() {
    return (
      <div className={CONTENT_CLASS}>
        <div className="luxia-creation-stack">
          <DataSourceModeSelector
            mode={draft.dataSourceMode}
            onChange={switchDataSourceMode}
            allowExisting={availableSources.length > 0}
          />

          {draft.dataSourceMode === "existing" ? (
            renderExistingSourcePicker()
          ) : (
            <>
              {renderNewSourceNameField({
                id: "ds-name-pdf",
                value: draft.dataSourceName,
                error: visibleDataErrors.dataSourceName,
                onChange: (dataSourceName) => updateDraft({ dataSourceName }),
              })}
              <OwnershipRadioList
                value={draft.ownership}
                onChange={(ownership) => updateDraft({ ownership })}
              />
              <CreationFileUpload
                accept=".pdf,application/pdf"
                acceptLabel="PDF"
                files={draft.uploadedFiles}
                onAdd={addUploadedFile}
                onRemove={removeUploadedFile}
                error={visibleDataErrors.files}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  function renderCsvDataStep() {
    return (
      <div className={CONTENT_CLASS}>
        <div className="luxia-creation-stack">
          <DataSourceModeSelector
            mode={draft.dataSourceMode}
            onChange={switchDataSourceMode}
            allowExisting={availableSources.length > 0}
          />

          {draft.dataSourceMode === "existing" ? (
            renderExistingSourcePicker()
          ) : (
            <>
              {renderNewSourceNameField({
                id: "ds-name-csv",
                value: draft.dataSourceName,
                error: visibleDataErrors.dataSourceName,
                onChange: (dataSourceName) => updateDraft({ dataSourceName }),
              })}
              <OwnershipRadioList
                value={draft.ownership}
                onChange={(ownership) => updateDraft({ ownership })}
              />
              <CreationFileUpload
                accept=".csv,text/csv"
                acceptLabel="CSV"
                files={draft.uploadedFiles}
                onAdd={addUploadedFile}
                onRemove={removeUploadedFile}
                error={visibleDataErrors.files}
              />
              {draft.uploadedFiles.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="luxia-creation-stack-tight">
                    <Label htmlFor="csv-delimiter">Delimiter</Label>
                    <Input
                      id="csv-delimiter"
                      value={draft.csvDelimiter}
                      onChange={(event) => updateDraft({ csvDelimiter: event.target.value })}
                      placeholder=","
                      maxLength={3}
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Checkbox
                      id="csv-has-header"
                      checked={draft.csvHasHeader}
                      onCheckedChange={(checked) => updateDraft({ csvHasHeader: checked === true })}
                    />
                    <Label htmlFor="csv-has-header" className="cursor-pointer">
                      First row contains column headers
                    </Label>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderReviewStep() {
    const sourceName = draft.dataSourceMode === "existing"
      ? availableSources.find((s) => s.id === draft.existingDataSourceId)?.name ?? "—"
      : draft.dataSourceName.trim() || "—";

    const addedData = buildReviewAddedDataSummary(draft, sourceName !== "—" ? sourceName : undefined);
    const reviewOwnership = ownershipLabelFromDraft(draft, availableSources);
    const reviewStatus = draft.dataSourceMode === "existing"
      ? "Existing Data Source"
      : "Ready to connect";

    return (
      <div className={CONTENT_CLASS}>
        <div className="luxia-creation-review-surface">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <div>
              <ReviewBlock
                title="Constellation"
                editLabel="Edit details"
                editAriaLabel="Edit Constellation details"
                onEdit={() => goToStep("basics")}
                rows={[
                  { label: "Name", value: draft.name.trim() || "—" },
                  { label: "Description", value: draft.description.trim() || "—" },
                  { label: "Type", value: draft.type ? constellationTypeLabel(draft.type) : "—" },
                  { label: "Project", value: projectName },
                ]}
              />
              <hr className="luxia-creation-review-divider" />
              <ReviewBlock
                title="Data Source"
                rows={[
                  { label: "Name", value: sourceName },
                  { label: "Type", value: draft.type ? constellationTypeLabel(draft.type) : "—" },
                  { label: "Ownership", value: reviewOwnership },
                  { label: "Status", value: reviewStatus },
                ]}
              />
            </div>

            <div>
              <ReviewBlock
                title="Added data"
                editLabel="Edit data"
                editAriaLabel="Edit added data"
                onEdit={() => goToStep("data")}
                rows={addedData.rows}
              />
              <hr className="luxia-creation-review-divider" />
              <section>
                <ReviewSectionHeader
                  title="Instruction"
                  action={
                    <ReviewEditButton
                      label={editingInstruction ? "Done" : "Edit instruction"}
                      ariaLabel={
                        editingInstruction
                          ? "Finish editing instruction"
                          : "Edit instruction"
                      }
                      showIcon={!editingInstruction}
                      onClick={() => setEditingInstruction((value) => !value)}
                    />
                  }
                />
                {editingInstruction ? (
                  <Textarea
                    value={draft.instruction}
                    rows={4}
                    onChange={(event) => {
                      instructionIsCustomRef.current = true;
                      updateDraft({ instruction: event.target.value });
                    }}
                    aria-label="Instruction"
                  />
                ) : (
                  <p className="luxia-type-body-dense luxia-creation-review-value">
                    {draft.instruction.trim() || "—"}
                  </p>
                )}
              </section>
              <hr className="luxia-creation-review-divider" />
              <div>
                <h3 className="mb-1 luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                  Readiness
                </h3>
                <p
                  className={`luxia-type-body-dense luxia-creation-readiness${
                    readiness.ready ? " is-ready" : " is-blocked"
                  }`}
                >
                  {readiness.ready ? (
                    <Check size={14} className="luxia-creation-readiness-icon" aria-hidden />
                  ) : null}
                  <span>{readiness.message}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStepContent() {
    if (draft.currentStep === "basics") return renderBasicsStep();
    if (draft.currentStep === "data") {
      if (draft.type === "database") return renderDatabaseDataStep();
      if (draft.type === "pdf") return renderPdfDataStep();
      if (draft.type === "csv") return renderCsvDataStep();
      return (
        <div className={CONTENT_CLASS}>
          <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
            Choose a Constellation type in Basics before adding data.
          </p>
        </div>
      );
    }
    return renderReviewStep();
  }

  return (
    <>
      <LuxiaPageFrame variant={CONSTELLATION_SETTINGS_PAGE_VARIANT}>
        <LuxiaPageHeader
          contentGap="page"
          pageTypeLabel="CONSTELLATION"
          title="Create Constellation"
          titleLeading={
            <button
              type="button"
              aria-label="Exit Constellation creation"
              className="luxia-creation-exit-button"
              onClick={requestLeaveCreation}
            >
              <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
            </button>
          }
          titleLeadingAccessible
          breadcrumb={<LuxiaBreadcrumb items={breadcrumbItems} handlers={breadcrumbHandlers} />}
          context={
            <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
              Create a new Constellation and add the data it will use.
            </p>
          }
        />
        <LuxiaPageBody>
          <StepProgress
            currentStep={draft.currentStep}
            onGoToStep={goToStep}
            draft={draft}
            existingNames={existingConstellationNames}
          />
          <div className={`${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-padded-sm luxia-creation-surface`}>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="sr-only"
            >
              {currentStepLabel}
            </h2>
            {renderStepContent()}
            <CreationActionBar
              showPreviousStep={stepIndex(draft.currentStep) > 0}
              primaryLabel={primaryLabel}
              primaryDisabled={primaryDisabled}
              onPrimary={isFinalStep ? handleCreate : goNext}
              onCancel={handleCancel}
              onPreviousStep={goPreviousStep}
              sticky={draft.currentStep === "data" && draft.type === "database"}
            />
          </div>
        </LuxiaPageBody>
      </LuxiaPageFrame>

      <AlertDialog
        open={showDiscardDialog}
        onOpenChange={(open) => {
          if (!open) {
            pendingNavigationRef.current = null;
            setShowDiscardDialog(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this Constellation draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your Constellation details and added data will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={confirmDiscardNavigation}>
              Discard draft
            </AlertDialogAction>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingType !== null} onOpenChange={(open) => !open && setPendingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Constellation type?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the Constellation type will remove incompatible data from this draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={confirmTypeChange}>Change type</AlertDialogAction>
            <AlertDialogCancel>Keep current type</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReviewEditButton({
  label,
  ariaLabel,
  onClick,
  showIcon = true,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  showIcon?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="compact"
      className="luxia-creation-review-edit-btn"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {showIcon ? (
        <Pencil size={14} strokeWidth={2} aria-hidden className="shrink-0" />
      ) : null}
      {label}
    </Button>
  );
}

function ReviewSectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="luxia-creation-review-section-header">
      <h3 className="luxia-creation-review-section-title">{title}</h3>
      {action}
    </div>
  );
}

function ReviewBlock({
  title,
  rows,
  onEdit,
  editLabel = "Edit",
  editAriaLabel,
}: {
  title: string;
  rows: { label: string; value: string }[];
  onEdit?: () => void;
  editLabel?: string;
  editAriaLabel?: string;
}) {
  return (
    <section>
      <ReviewSectionHeader
        title={title}
        action={
          onEdit ? (
            <ReviewEditButton
              label={editLabel}
              ariaLabel={editAriaLabel ?? editLabel}
              onClick={onEdit}
            />
          ) : undefined
        }
      />
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 sm:grid-cols-[120px_1fr]">
            <dt className="luxia-type-caption luxia-creation-review-label">
              {row.label}
            </dt>
            <dd
              className="luxia-type-body-dense luxia-creation-review-value break-words"
              title={row.value}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
