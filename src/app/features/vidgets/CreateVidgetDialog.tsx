import { useEffect, useMemo, useState } from "react";
import {
  CreateLuxiaModalFooter,
  CreateLuxiaModalShell,
  CreateLuxiaOptionCard,
  CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS,
  CREATE_LUXIA_MODAL_MUTED_TEXT,
  CREATE_LUXIA_MODAL_PRIMARY_TEXT,
  CREATE_LUXIA_MODAL_SECTION_LABEL_CLASS,
} from "@/app/components/CreateLuxiaModal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup } from "@/app/components/ui/radio-group";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { normalizeGalaxyConstellationIds } from "./data";
import { KnowledgeScopeSelector } from "./KnowledgeScopeSelector";
import type {
  VidgetChannel,
  VidgetCreateSourcePreset,
  VidgetSourceType,
} from "./types";
import {
  VIDGET_CHANNEL_LABELS,
} from "./types";

export type CreateVidgetSubmitPayload = {
  name: string;
  sourceType: VidgetSourceType;
  galaxyId: string | null;
  constellationId: string | null;
  galaxyConstellationIds: string[];
  channel: VidgetChannel;
};

export interface CreateVidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  galaxyName: string;
  galaxyId: string | null;
  constellations: { id: string; name: string; type?: string }[];
  sourcePreset: VidgetCreateSourcePreset;
  onCreate: (payload: CreateVidgetSubmitPayload) => boolean;
}

type Step = "basics" | "channel";

type SourceSnapshot = {
  sourceType: VidgetSourceType;
  constellationId: string | null;
  galaxyConstellationIds: string[];
};

function resolvePresetSource(preset: VidgetCreateSourcePreset): {
  sourceType: VidgetSourceType;
  constellationId: string | null;
} {
  if (preset.kind === "constellation") {
    return { sourceType: "constellation", constellationId: preset.constellationId };
  }
  return { sourceType: "galaxy", constellationId: null };
}

const CHANNEL_OPTIONS: {
  id: VidgetChannel;
  title: string;
  description: string;
}[] = [
  {
    id: "web",
    title: VIDGET_CHANNEL_LABELS.web,
    description:
      "Landing Page / Web — embed, hosted URL, mobile, Totem, QR",
  },
  {
    id: "voip",
    title: VIDGET_CHANNEL_LABELS.voip,
    description: "Voice over Internet Protocol — voice-call channel",
  },
  {
    id: "whatsapp",
    title: VIDGET_CHANNEL_LABELS.whatsapp,
    description: "Messaging channel configuration (prototype)",
  },
];

export function CreateVidgetDialog({
  open,
  onOpenChange,
  projectName,
  galaxyName,
  galaxyId,
  constellations,
  sourcePreset,
  onCreate,
}: CreateVidgetDialogProps) {
  const lockedSource = sourcePreset.kind !== "choose";
  const presetSource = resolvePresetSource(sourcePreset);

  const [step, setStep] = useState<Step>("basics");
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<VidgetSourceType>(presetSource.sourceType);
  const [constellationId, setConstellationId] = useState<string | null>(
    presetSource.constellationId,
  );
  const [galaxyConstellationIds, setGalaxyConstellationIds] = useState<string[]>([]);
  const [sourceSnapshot, setSourceSnapshot] = useState<SourceSnapshot | null>(null);
  const [channel, setChannel] = useState<VidgetChannel>("web");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = resolvePresetSource(sourcePreset);
    setStep("basics");
    setName("");
    setSourceType(next.sourceType);
    setConstellationId(next.constellationId);
    setGalaxyConstellationIds([]);
    setSourceSnapshot(null);
    setChannel("web");
    setError(null);
  }, [open, sourcePreset]);

  const constellationOptions = useMemo(
    () =>
      constellations.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [constellations],
  );

  const lockedConstellationName = useMemo(() => {
    const id = constellationId ?? presetSource.constellationId;
    return constellations.find((item) => item.id === id)?.name ?? "";
  }, [constellationId, constellations, presetSource.constellationId]);

  function handleClose() {
    onOpenChange(false);
  }

  function validateBasics(): boolean {
    if (!name.trim()) {
      setError("Enter a Vidget name.");
      return false;
    }
    if (sourceType === "galaxy") {
      if (!galaxyId) {
        setError("This Project has no Galaxy available for a Vidget source.");
        return false;
      }
      const scope = normalizeGalaxyConstellationIds(galaxyConstellationIds);
      if (scope.length === 0) {
        setError("Select at least one Constellation for knowledge scope.");
        return false;
      }
      const projectIds = new Set(constellations.map((item) => item.id));
      if (scope.some((id) => !projectIds.has(id))) {
        setError("Every selected Constellation must belong to this Project.");
        return false;
      }
    } else if (!constellationId) {
      setError("Choose a Constellation source.");
      return false;
    } else if (!constellations.some((item) => item.id === constellationId)) {
      setError("Choose a Constellation from this Project.");
      return false;
    }
    setError(null);
    return true;
  }

  function buildSourceSnapshot(): SourceSnapshot {
    return {
      sourceType,
      constellationId: sourceType === "constellation" ? constellationId : null,
      galaxyConstellationIds:
        sourceType === "galaxy"
          ? normalizeGalaxyConstellationIds(galaxyConstellationIds)
          : [],
    };
  }

  function handleCreate() {
    if (!validateBasics()) {
      setStep("basics");
      return;
    }
    const snapshot = sourceSnapshot ?? buildSourceSnapshot();
    const created = onCreate({
      name: name.trim(),
      sourceType: snapshot.sourceType,
      galaxyId: snapshot.sourceType === "galaxy" ? galaxyId : null,
      constellationId:
        snapshot.sourceType === "constellation" ? snapshot.constellationId : null,
      galaxyConstellationIds: snapshot.galaxyConstellationIds,
      channel,
    });
    if (created) {
      handleClose();
    }
  }

  const description = lockedSource
    ? `External Luxia AI experience for ${projectName}. Source is set from where you started.`
    : `External Luxia AI experience for ${projectName}. Choose what should power this Vidget, then where it will be used.`;

  const showGalaxyScope = sourceType === "galaxy";

  return (
    <CreateLuxiaModalShell
      open={open}
      onClose={handleClose}
      titleId="create-vidget-title"
      title="Create Vidget"
      description={description}
      footer={
        <CreateLuxiaModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {step === "channel" ? (
            <Button type="button" variant="secondary" onClick={() => setStep("basics")}>
              Back
            </Button>
          ) : null}
          {step === "basics" ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (!validateBasics()) return;
                setSourceSnapshot(buildSourceSnapshot());
                setStep("channel");
              }}
            >
              Continue
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleCreate}>
              Create Vidget
            </Button>
          )}
        </CreateLuxiaModalFooter>
      }
    >
      <p className="luxia-type-metadata" style={CREATE_LUXIA_MODAL_MUTED_TEXT}>
        Step {step === "basics" ? "1" : "2"} of 2 ·{" "}
        {step === "basics" ? "Basics" : "Channel"}
      </p>

      {step === "basics" ? (
        <>
          <section aria-label="Vidget basics">
            <Label
              htmlFor="vidget-create-name"
              className={CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS}
              style={CREATE_LUXIA_MODAL_PRIMARY_TEXT}
            >
              Vidget name
            </Label>
            <Input
              id="vidget-create-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Vidget name 01"
              autoComplete="off"
            />
          </section>

          <section aria-label="Vidget source">
            <Label
              className={CREATE_LUXIA_MODAL_SECTION_LABEL_CLASS}
              style={CREATE_LUXIA_MODAL_MUTED_TEXT}
            >
              Source
            </Label>

            {lockedSource ? (
              <div className="space-y-5">
                {sourceType === "galaxy" ? (
                  <>
                    <div>
                      <Label
                        htmlFor="vidget-locked-galaxy"
                        className={CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS}
                        style={CREATE_LUXIA_MODAL_PRIMARY_TEXT}
                      >
                        Galaxy
                      </Label>
                      <SearchableSelect
                        id="vidget-locked-galaxy"
                        value={galaxyId ?? "locked-galaxy"}
                        onValueChange={() => undefined}
                        options={[
                          {
                            value: galaxyId ?? "locked-galaxy",
                            label: galaxyName || "Galaxy",
                          },
                        ]}
                        placeholder={galaxyName || "Galaxy"}
                        disabled
                      />
                      <p className="mt-2 luxia-type-metadata" style={CREATE_LUXIA_MODAL_MUTED_TEXT}>
                        Source is locked for this creation path.
                      </p>
                    </div>
                    <KnowledgeScopeSelector
                      idPrefix="vidget-create-scope"
                      constellations={constellations}
                      selectedIds={galaxyConstellationIds}
                      onChange={(ids) => {
                        setGalaxyConstellationIds(ids);
                        if (error) setError(null);
                      }}
                      variant="modal"
                    />
                  </>
                ) : (
                  <div>
                    <Label
                      htmlFor="vidget-locked-constellation"
                      className={CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS}
                      style={CREATE_LUXIA_MODAL_PRIMARY_TEXT}
                    >
                      Constellation
                    </Label>
                    <SearchableSelect
                      id="vidget-locked-constellation"
                      value={constellationId ?? ""}
                      onValueChange={() => undefined}
                      options={[
                        {
                          value: constellationId ?? "",
                          label: lockedConstellationName || "Constellation",
                        },
                      ]}
                      placeholder={lockedConstellationName || "Constellation"}
                      disabled
                    />
                    <p className="mt-2 luxia-type-metadata" style={CREATE_LUXIA_MODAL_MUTED_TEXT}>
                      Source is locked for this creation path.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <RadioGroup
                  value={sourceType}
                  onValueChange={(value) => {
                    const next = value as VidgetSourceType;
                    setSourceType(next);
                    if (next === "galaxy") {
                      setConstellationId(null);
                      setGalaxyConstellationIds([]);
                    } else {
                      setGalaxyConstellationIds([]);
                    }
                    if (error) setError(null);
                  }}
                  className="grid gap-2.5 sm:grid-cols-2"
                >
                  <CreateLuxiaOptionCard
                    id="vidget-source-galaxy"
                    value="galaxy"
                    title="Galaxy"
                    description={galaxyName || "This Project’s Galaxy"}
                    selected={sourceType === "galaxy"}
                  />
                  <CreateLuxiaOptionCard
                    id="vidget-source-constellation"
                    value="constellation"
                    title="Constellation"
                    description="Choose one Constellation from this Project"
                    selected={sourceType === "constellation"}
                  />
                </RadioGroup>

                {showGalaxyScope ? (
                  <>
                    <div className="mt-5">
                      <Label
                        htmlFor="vidget-galaxy"
                        className={CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS}
                        style={CREATE_LUXIA_MODAL_PRIMARY_TEXT}
                      >
                        Galaxy
                      </Label>
                      <SearchableSelect
                        id="vidget-galaxy"
                        value={galaxyId ?? "project-galaxy"}
                        onValueChange={() => undefined}
                        options={[
                          {
                            value: galaxyId ?? "project-galaxy",
                            label: galaxyName || "Galaxy",
                          },
                        ]}
                        placeholder={galaxyName || "Galaxy"}
                        disabled
                      />
                    </div>
                    <div className="mt-5">
                      <KnowledgeScopeSelector
                        idPrefix="vidget-create-scope"
                        constellations={constellations}
                        selectedIds={galaxyConstellationIds}
                        onChange={(ids) => {
                          setGalaxyConstellationIds(ids);
                          if (error) setError(null);
                        }}
                        variant="modal"
                      />
                    </div>
                  </>
                ) : constellations.length === 0 ? (
                  <p className="mt-5 luxia-type-metadata" style={CREATE_LUXIA_MODAL_MUTED_TEXT}>
                    No Constellations in this Project.
                  </p>
                ) : (
                  <div className="mt-5">
                    <Label
                      htmlFor="vidget-constellation"
                      className={CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS}
                      style={CREATE_LUXIA_MODAL_PRIMARY_TEXT}
                    >
                      Constellation
                    </Label>
                    <SearchableSelect
                      id="vidget-constellation"
                      value={constellationId ?? ""}
                      onValueChange={(value) => {
                        setConstellationId(value);
                        if (error) setError(null);
                      }}
                      options={constellationOptions}
                      placeholder="Search or select a constellation"
                      emptyText="No constellations available"
                      noResultsText="No constellations found"
                      disabled={constellations.length === 0}
                    />
                  </div>
                )}
              </>
            )}

            {error ? (
              <p
                className="mt-2 luxia-type-metadata"
                style={{ color: "var(--luxia-danger, #b42318)" }}
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </section>
        </>
      ) : (
        <section aria-label="Vidget channel">
          <Label
            className={CREATE_LUXIA_MODAL_SECTION_LABEL_CLASS}
            style={CREATE_LUXIA_MODAL_MUTED_TEXT}
          >
            Channel
          </Label>
          <p className="mb-3 luxia-type-metadata" style={CREATE_LUXIA_MODAL_MUTED_TEXT}>
            Where this Vidget will be used. Channel is separate from source.
          </p>
          <RadioGroup
            value={channel}
            onValueChange={(value) => setChannel(value as VidgetChannel)}
            className="grid gap-2.5"
          >
            {CHANNEL_OPTIONS.map((option) => (
              <CreateLuxiaOptionCard
                key={option.id}
                id={`vidget-channel-${option.id}`}
                value={option.id}
                title={option.title}
                description={option.description}
                selected={channel === option.id}
              />
            ))}
          </RadioGroup>
        </section>
      )}
    </CreateLuxiaModalShell>
  );
}
