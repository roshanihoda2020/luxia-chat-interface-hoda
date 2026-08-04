import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";
import {
  DATA_SOURCE_CATALOG,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";
import { constellationTypeLabel } from "@/app/features/constellation-settings/types";

export type NewConstellationDraft = {
  type: CapsuleConstellationType;
  name: string;
  description: string;
  dataSourceIds: string[];
};

type StepId = "type" | "details" | "data" | "optional" | "review";

const STEPS: { id: StepId; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "details", label: "Details" },
  { id: "data", label: "Data" },
  { id: "optional", label: "Optional setup" },
  { id: "review", label: "Review" },
];

function sourcesForType(type: CapsuleConstellationType): DataSourceCatalogItem[] {
  return DATA_SOURCE_CATALOG.filter((source) => {
    const normalized = source.type.toLowerCase();
    if (type === "database") return normalized.includes("database");
    if (type === "csv") return normalized.includes("csv");
    return normalized.includes("pdf");
  });
}

export function NewConstellationModal({
  open,
  projectId,
  projectName,
  existingNames,
  onClose,
  onCreate,
}: {
  open: boolean;
  projectId: string;
  projectName: string;
  existingNames: string[];
  onClose: () => void;
  onCreate: (draft: NewConstellationDraft) => void;
}) {
  const [step, setStep] = useState<StepId>("type");
  const [type, setType] = useState<CapsuleConstellationType>("database");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataSourceIds, setDataSourceIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setType("database");
    setName("");
    setDescription("");
    setDataSourceIds([]);
    setNameError(null);
  }, [open]);

  const availableSources = useMemo(() => sourcesForType(type), [type]);

  useEffect(() => {
    setDataSourceIds((prev) =>
      prev.filter((id) => availableSources.some((source) => source.id === id)),
    );
  }, [availableSources]);

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);

  function validateName(): boolean {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return false;
    }
    const duplicate = existingNames.some(
      (entry) => entry.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setNameError("A Constellation with this name already exists in this Project.");
      return false;
    }
    setNameError(null);
    return true;
  }

  function goNext() {
    if (step === "details" && !validateName()) return;
    if (step === "data" && dataSourceIds.length === 0) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  }

  function handleCreate() {
    if (!validateName() || dataSourceIds.length === 0) return;
    onCreate({
      type,
      name: name.trim(),
      description: description.trim() || `${constellationTypeLabel(type)} Constellation for ${projectName}.`,
      dataSourceIds: [...dataSourceIds],
    });
    onClose();
  }

  function toggleSource(id: string) {
    setDataSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Constellation</DialogTitle>
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {projectName} · Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]?.label}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {step === "type" ? (
            <fieldset className="space-y-2">
              <legend className="luxia-type-body-dense-strong">Constellation type</legend>
              {(["database", "csv", "pdf"] as const).map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-[8px] border px-3 py-2"
                  style={{ borderColor: type === option ? "var(--luxia-purple-40)" : "var(--luxia-border-default)" }}
                >
                  <input
                    type="radio"
                    name="constellation-type"
                    checked={type === option}
                    onChange={() => setType(option)}
                  />
                  <span className="luxia-type-body-dense">{constellationTypeLabel(option)}</span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {step === "details" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-constellation-name">Name</Label>
                <Input
                  id="new-constellation-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError(null);
                  }}
                  placeholder="Constellation name 01"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "new-constellation-name-error" : undefined}
                />
                {nameError ? (
                  <p id="new-constellation-name-error" className="luxia-type-caption" style={{ color: "var(--luxia-error)" }}>
                    {nameError}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-constellation-description">Description</Label>
                <Textarea
                  id="new-constellation-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Optional short description"
                />
              </div>
            </div>
          ) : null}

          {step === "data" ? (
            <fieldset className="space-y-2">
              <legend className="luxia-type-body-dense-strong">
                Connect at least one Data Source
              </legend>
              {availableSources.length === 0 ? (
                <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-muted)" }}>
                  No matching Data Sources are available for this type.
                </p>
              ) : (
                availableSources.map((source) => (
                  <label
                    key={source.id}
                    className="flex cursor-pointer items-start gap-2 rounded-[8px] border px-3 py-2"
                    style={{ borderColor: "var(--luxia-border-default)" }}
                  >
                    <input
                      type="checkbox"
                      checked={dataSourceIds.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block luxia-type-body-dense-strong">{source.name}</span>
                      <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                        {source.type} · {source.ownership === "organizational" ? "Organizational" : "Private"}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </fieldset>
          ) : null}

          {step === "optional" ? (
            <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
              Capability configuration (tables, files, knowledge, and instruction) can be completed after creation in Constellation Settings. No Chat is created automatically.
            </p>
          ) : null}

          {step === "review" ? (
            <dl className="space-y-2 luxia-type-body-dense">
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--luxia-text-muted)" }}>Project</dt>
                <dd>{projectName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--luxia-text-muted)" }}>Type</dt>
                <dd>{constellationTypeLabel(type)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--luxia-text-muted)" }}>Name</dt>
                <dd>{name.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt style={{ color: "var(--luxia-text-muted)" }}>Data Sources</dt>
                <dd>{dataSourceIds.length}</dd>
              </div>
              <p className="pt-1 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                Project id: {projectId}
              </p>
            </dl>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="secondary" onClick={stepIndex === 0 ? onClose : goBack}>
            {stepIndex === 0 ? "Cancel" : "Back"}
          </Button>
          {step === "review" ? (
            <Button type="button" variant="primary" onClick={handleCreate} disabled={dataSourceIds.length === 0}>
              Create Constellation
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={goNext}
              disabled={step === "data" && dataSourceIds.length === 0}
            >
              Continue
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
