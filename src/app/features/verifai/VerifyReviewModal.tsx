import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  CheckCircle2, FileText, ListChecks, Loader2, PenLine, Plus, ShieldCheck, Trash2, Upload, X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import {
  VERIFAI_CHECKLISTS,
  VERIFAI_MANUAL_SAMPLE,
  VERIFAI_UPLOADED_CHECKLIST_SECTIONS,
  checklistRequirementCount,
  uploadedChecklistRequirements,
  verifaiScopeDocuments,
  type VerifaiChecklistDefinition,
} from "./mockData";
import type {
  VerifaiChecklist,
  VerifaiChecklistSource,
  VerifaiDocument,
  VerifaiLaunchContext,
  VerifaiStartInput,
} from "./types";
import "./verifai.css";

type ChecklistOption = {
  id: string;
  kind: "gdpr" | "procurement" | "upload";
  name: string;
  requirementCount: number;
  sectionCount: number;
  uploaded: string;
};

type WorkingSection = { title: string; requirements: Array<{ id: string; text: string }> };

/** Files uploaded in this session for VerifAI only (never added to Data Sources). */
const sessionChecklists: ChecklistOption[] = [];
const sessionDocuments: Record<string, VerifaiDocument[]> = {};

const BASE_CHECKLISTS: ChecklistOption[] = VERIFAI_CHECKLISTS.map((c) => ({
  id: c.id,
  kind: c.id,
  name: c.fileName,
  requirementCount: checklistRequirementCount(c),
  sectionCount: c.sections.length,
  uploaded: c.uploaded,
}));

const CHECKLIST_EXTENSIONS = [".xlsx", ".csv", ".docx", ".txt"];

function parseRules(text: string): string[] {
  return text.split("\n").map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function cloneSections(def: VerifaiChecklistDefinition): WorkingSection[] {
  return def.sections.map((s) => ({ title: s.title, requirements: s.requirements.map((r) => ({ ...r })) }));
}

function countOf(sections: WorkingSection[]) {
  return {
    requirements: sections.reduce((n, s) => n + s.requirements.length, 0),
    sections: sections.filter((s) => s.requirements.length > 0).length,
  };
}

function sameSections(a: WorkingSection[], b: WorkingSection[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function nextRequirementId(def: VerifaiChecklistDefinition, sections: WorkingSection[]) {
  const prefix = def.id === "gdpr" ? "REQ" : "PC";
  const used = [...def.sections, ...sections].flatMap((s) => s.requirements.map((r) => Number(r.id.split("-")[1]) || 0));
  return `${prefix}-${String(Math.max(0, ...used) + 1).padStart(2, "0")}`;
}

const SOURCE_OPTIONS: Array<{ id: VerifaiChecklistSource; label: string; icon: typeof Upload }> = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "structured", label: "Structured", icon: ListChecks },
  { id: "manual", label: "Manual", icon: PenLine },
];

function focusComposer() {
  window.requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("textarea[aria-label=Message]")?.focus());
}

export function VerifyReviewModal({
  open,
  context,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  context: VerifaiLaunchContext | null;
  onOpenChange: (open: boolean) => void;
  onStart: (input: VerifaiStartInput) => void;
}) {
  const [source, setSource] = useState<VerifaiChecklistSource>("upload");
  const [checklists, setChecklists] = useState<ChecklistOption[]>(() => [...BASE_CHECKLISTS, ...sessionChecklists]);
  const [checklistId, setChecklistId] = useState(BASE_CHECKLISTS[0].id);
  const [checklistUpload, setChecklistUpload] = useState<{ name: string } | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  // Structured: a working copy per checklist, used only by this review.
  const [structuredId, setStructuredId] = useState<"gdpr" | "procurement">("gdpr");
  const [prepared, setPrepared] = useState<Record<string, "idle" | "preparing" | "ready">>({});
  const [applied, setApplied] = useState<Record<string, WorkingSection[]>>({});
  const [drafts, setDrafts] = useState<Record<string, WorkingSection[] | undefined>>({});
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [scopeId, setScopeId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [docUpload, setDocUpload] = useState<{ name: string; progress: number } | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [docsVersion, setDocsVersion] = useState(0);
  const checklistInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const timersRef = useRef<number[]>([]);
  const focusRequirementRef = useRef<string | null>(null);

  const constellations = context?.constellations ?? [];
  const isGalaxy = context?.chatType === "galaxy";

  useEffect(() => {
    if (!open) return;
    setSource("upload");
    setChecklists([...BASE_CHECKLISTS, ...sessionChecklists]);
    setChecklistId(BASE_CHECKLISTS[0].id);
    setChecklistUpload(null);
    setChecklistError(null);
    setStructuredId("gdpr");
    setPrepared({});
    setApplied({});
    setDrafts({});
    setConfirmRemove(null);
    setEditError(null);
    setManualText("");
    setDocUpload(null);
    setDocError(null);
    setAttempted(false);
    const firstScope = context?.constellations[0]?.id ?? "";
    setScopeId(firstScope);
    setDocumentId(firstScope ? verifaiScopeDocuments(firstScope)[0].id : "");
  }, [open, context]);

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (fn: () => void, ms: number) => { timersRef.current.push(window.setTimeout(fn, ms)); };

  useEffect(() => {
    const id = focusRequirementRef.current;
    if (!id) return;
    focusRequirementRef.current = null;
    document.querySelector<HTMLInputElement>(`[data-vfy-req-input="${id}"]`)?.focus();
  });

  const scope = constellations.find((c) => c.id === scopeId) ?? null;
  const documents = useMemo(
    () => (scopeId ? [...verifaiScopeDocuments(scopeId), ...(sessionDocuments[scopeId] ?? [])] : []),
    // docsVersion re-reads session uploads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeId, docsVersion],
  );
  const targetDocument = documents.find((d) => d.id === documentId) ?? null;
  const manualRules = parseRules(manualText);
  const uploadedChecklist = checklists.find((c) => c.id === checklistId) ?? null;

  const structuredDef = VERIFAI_CHECKLISTS.find((c) => c.id === structuredId)!;
  const structuredState = prepared[structuredId] ?? "idle";
  const appliedSections = applied[structuredId] ?? cloneSections(structuredDef);
  const draftSections = drafts[structuredId];
  const editing = Boolean(draftSections);
  const shownSections = draftSections ?? appliedSections;
  const shownCount = countOf(shownSections);
  const isEdited = !sameSections(appliedSections, cloneSections(structuredDef));
  const hasUnsavedEdits = Boolean(draftSections && !sameSections(draftSections, appliedSections));

  const checklist: VerifaiChecklist | null = (() => {
    if (source === "upload") {
      if (!uploadedChecklist || checklistUpload) return null;
      if (uploadedChecklist.kind === "upload") {
        const requirements = uploadedChecklistRequirements();
        return { kind: "upload", name: uploadedChecklist.name, source, requirementCount: requirements.length, sectionCount: VERIFAI_UPLOADED_CHECKLIST_SECTIONS, requirements, originalIds: [] };
      }
      const def = VERIFAI_CHECKLISTS.find((c) => c.id === uploadedChecklist.kind)!;
      const requirements = def.sections.flatMap((s) => s.requirements);
      return { kind: def.id, name: def.fileName, source, requirementCount: requirements.length, sectionCount: def.sections.length, requirements, originalIds: requirements.map((r) => r.id) };
    }
    if (source === "structured") {
      if (structuredState !== "ready" || editing) return null;
      const requirements = appliedSections.flatMap((s) => s.requirements);
      if (!requirements.length) return null;
      const counts = countOf(appliedSections);
      return {
        kind: structuredDef.id,
        name: isEdited ? `${structuredDef.name} (edited)` : structuredDef.name,
        source,
        requirementCount: counts.requirements,
        sectionCount: counts.sections,
        requirements,
        originalIds: structuredDef.sections.flatMap((s) => s.requirements.map((r) => r.id)),
      };
    }
    if (!manualRules.length) return null;
    const requirements = manualRules.map((text, i) => ({ id: `RULE-${String(i + 1).padStart(2, "0")}`, text }));
    return { kind: "manual", name: "Manual checklist", source, requirementCount: requirements.length, sectionCount: 1, requirements, originalIds: [] };
  })();

  const blocker = !scope
    ? "There is no Constellation you can use in this Project."
    : !checklist
      ? source === "upload"
        ? checklistUpload ? "Wait for the checklist upload to finish." : "Choose or upload a checklist."
        : source === "structured"
          ? editing
            ? "Apply or cancel your checklist changes first."
            : structuredState === "preparing" ? "Preparing the checklist…" : structuredState === "ready" ? "Add at least one requirement." : "Prepare the checklist first."
          : "Add at least one checklist rule."
      : docUpload
        ? "Wait for the PDF upload to finish."
        : !targetDocument
          ? "Select a target PDF document."
          : null;

  function selectSourceByIndex(index: number) {
    const option = SOURCE_OPTIONS[(index + SOURCE_OPTIONS.length) % SOURCE_OPTIONS.length];
    setSource(option.id);
    tabRefs.current[SOURCE_OPTIONS.indexOf(option)]?.focus();
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); selectSourceByIndex(index + 1); }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); selectSourceByIndex(index - 1); }
    if (event.key === "Home") { event.preventDefault(); selectSourceByIndex(0); }
    if (event.key === "End") { event.preventDefault(); selectSourceByIndex(SOURCE_OPTIONS.length - 1); }
  }

  function handleChecklistFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!CHECKLIST_EXTENSIONS.includes(ext)) {
      setChecklistError(`"${file.name}" isn't a supported checklist. Use Excel, CSV, Word or TXT.`);
      return;
    }
    setChecklistError(null);
    setChecklistUpload({ name: file.name });
    later(() => {
      const added: ChecklistOption = {
        id: `cl-upload-${Date.now()}`,
        kind: "upload",
        name: file.name,
        requirementCount: uploadedChecklistRequirements().length,
        sectionCount: VERIFAI_UPLOADED_CHECKLIST_SECTIONS,
        uploaded: "Uploaded just now",
      };
      sessionChecklists.push(added);
      setChecklists((list) => [...list, added]);
      setChecklistId(added.id);
      setChecklistUpload(null);
    }, 1200);
  }

  function handlePdfFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !scopeId) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setDocError(`"${file.name}" isn't a PDF. Only PDF documents can be verified.`);
      return;
    }
    setDocError(null);
    const targetScope = scopeId;
    setDocUpload({ name: file.name, progress: 0 });
    [25, 55, 85].forEach((progress, i) => later(() => setDocUpload((u) => (u ? { ...u, progress } : u)), 250 * (i + 1)));
    later(() => {
      const doc: VerifaiDocument = {
        id: `${targetScope}:upload-${Date.now()}`,
        name: file.name,
        pages: Math.max(1, Math.round(file.size / 60000)),
        sizeLabel: formatSize(file.size),
        updated: "Uploaded just now",
        origin: "upload",
        template: "upload",
      };
      sessionDocuments[targetScope] = [...(sessionDocuments[targetScope] ?? []), doc];
      setDocsVersion((v) => v + 1);
      setDocumentId(doc.id);
      setDocUpload(null);
    }, 1100);
  }

  function prepareStructured() {
    const id = structuredId;
    setPrepared((p) => ({ ...p, [id]: "preparing" }));
    later(() => setPrepared((p) => ({ ...p, [id]: "ready" })), 1000);
  }

  function updateDraft(update: (sections: WorkingSection[]) => WorkingSection[]) {
    setDrafts((d) => ({ ...d, [structuredId]: update(d[structuredId] ?? appliedSections) }));
    setEditError(null);
  }

  function startEditing() {
    setDrafts((d) => ({ ...d, [structuredId]: appliedSections.map((s) => ({ ...s, requirements: s.requirements.map((r) => ({ ...r })) })) }));
    setEditError(null);
  }

  function addRequirement(sectionIndex: number) {
    const id = nextRequirementId(structuredDef, draftSections ?? appliedSections);
    focusRequirementRef.current = id;
    updateDraft((sections) => sections.map((s, i) => (i === sectionIndex ? { ...s, requirements: [...s.requirements, { id, text: "" }] } : s)));
  }

  function applyEdits() {
    if (!draftSections) return;
    const empty = draftSections.flatMap((s) => s.requirements).find((r) => !r.text.trim());
    if (empty) {
      setEditError(`Enter text for ${empty.id} or remove it.`);
      document.querySelector<HTMLInputElement>(`[data-vfy-req-input="${empty.id}"]`)?.focus();
      return;
    }
    if (countOf(draftSections).requirements === 0) {
      setEditError("Keep at least one requirement.");
      return;
    }
    const cleaned = draftSections.map((s) => ({ ...s, requirements: s.requirements.map((r) => ({ ...r, text: r.text.trim() })) }));
    setApplied((a) => ({ ...a, [structuredId]: cleaned }));
    setDrafts((d) => ({ ...d, [structuredId]: undefined }));
    setConfirmRemove(null);
    setEditError(null);
  }

  function cancelEdits() {
    setDrafts((d) => ({ ...d, [structuredId]: undefined }));
    setConfirmRemove(null);
    setEditError(null);
  }

  function resetToOriginal() {
    setApplied((a) => ({ ...a, [structuredId]: cloneSections(structuredDef) }));
  }

  function editStructuredManually() {
    setManualText(appliedSections.flatMap((s) => s.requirements.map((r) => r.text)).join("\n"));
    setSource("manual");
  }

  function handleStart() {
    setAttempted(true);
    if (blocker || !context || !scope || !checklist || !targetDocument) return;
    onStart({
      chatId: context.chatId,
      projectId: context.projectId,
      projectName: context.projectName,
      scope: { kind: context.chatType, constellationId: scope.id, constellationLabel: scope.label },
      document: targetDocument,
      checklist,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="lx-vfy-modal"
        aria-describedby="lx-vfy-modal-desc"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>("[role=tab][aria-selected=true]")?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          focusComposer();
        }}
      >
        <div className="lx-vfy-modal__header">
          <span className="lx-vfy-modal__logo" aria-hidden><LuxiaStarLogo size={22} /></span>
          <div className="min-w-0">
            <DialogTitle className="lx-vfy-modal__title">Verify Review</DialogTitle>
            <DialogDescription id="lx-vfy-modal-desc" className="lx-vfy-modal__subtitle">
              Review a document against a checklist of requirements.
            </DialogDescription>
          </div>
          <button type="button" className="lx-vfy-icon-btn lx-vfy-modal__close" aria-label="Close Verify Review" onClick={() => onOpenChange(false)}>
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="lx-vfy-modal__body">
          <section className="lx-vfy-modal__col" aria-labelledby="lx-vfy-source-title">
            <h3 id="lx-vfy-source-title" className="lx-vfy-overline">Review source</h3>
            <div className="lx-vfy-segmented" role="tablist" aria-label="Review source">
              {SOURCE_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                const selected = source === option.id;
                return (
                  <button
                    key={option.id}
                    ref={(el) => { tabRefs.current[index] = el; }}
                    type="button"
                    role="tab"
                    id={`lx-vfy-tab-${option.id}`}
                    aria-selected={selected}
                    aria-controls={`lx-vfy-panel-${option.id}`}
                    tabIndex={selected ? 0 : -1}
                    className="lx-vfy-segmented__item"
                    data-active={selected || undefined}
                    onClick={() => setSource(option.id)}
                    onKeyDown={(e) => handleTabKey(e, index)}
                  >
                    <Icon size={14} aria-hidden />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {source === "upload" ? (
              <div className="lx-vfy-panel" role="tabpanel" id="lx-vfy-panel-upload" aria-labelledby="lx-vfy-tab-upload">
                <label className="lx-vfy-label" htmlFor="lx-vfy-checklist-select">Checklist</label>
                <select id="lx-vfy-checklist-select" className="lx-vfy-select" value={checklistId} onChange={(e) => setChecklistId(e.target.value)} disabled={Boolean(checklistUpload)}>
                  {checklists.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {uploadedChecklist && !checklistUpload ? (
                  <div className="lx-vfy-file-card">
                    <ListChecks size={18} aria-hidden className="lx-vfy-file-card__icon" />
                    <div className="min-w-0">
                      <p className="lx-vfy-file-card__name" title={uploadedChecklist.name}>{uploadedChecklist.name}</p>
                      <p className="lx-vfy-file-card__meta">{uploadedChecklist.uploaded}</p>
                    </div>
                    <span className="lx-vfy-count" data-vfy-requirement-count={uploadedChecklist.requirementCount}>
                      {uploadedChecklist.requirementCount} requirements
                    </span>
                  </div>
                ) : null}
                {checklistUpload ? (
                  <p className="lx-vfy-status" role="status"><Loader2 size={14} className="lx-vfy-spin" aria-hidden /> Reading “{checklistUpload.name}”…</p>
                ) : null}
                <input ref={checklistInputRef} type="file" accept={CHECKLIST_EXTENSIONS.join(",")} hidden onChange={handleChecklistFile} data-vfy-checklist-input="" />
                <Button type="button" variant="secondary" size="sm" className="lx-vfy-upload-btn" onClick={() => checklistInputRef.current?.click()} disabled={Boolean(checklistUpload)}>
                  <Upload size={14} aria-hidden /> Upload checklist file
                </Button>
                <p className="lx-vfy-hint">Excel, CSV, Word or TXT. Not added to Data Sources.</p>
                {checklistError ? <p className="lx-vfy-error" role="alert">{checklistError}</p> : null}
              </div>
            ) : null}

            {source === "structured" ? (
              <div className="lx-vfy-panel" role="tabpanel" id="lx-vfy-panel-structured" aria-labelledby="lx-vfy-tab-structured">
                <label className="lx-vfy-label" htmlFor="lx-vfy-structured-select">Checklist</label>
                <select
                  id="lx-vfy-structured-select"
                  className="lx-vfy-select"
                  value={structuredId}
                  disabled={editing}
                  onChange={(e) => { setStructuredId(e.target.value as "gdpr" | "procurement"); setConfirmRemove(null); }}
                >
                  {VERIFAI_CHECKLISTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="lx-vfy-structured__head">
                  <p className="lx-vfy-structured__title">
                    {editing ? "Editing working copy" : isEdited ? "Edited for this review" : "Requirements"}
                  </p>
                  <span className="lx-vfy-count" data-vfy-structured-count={`${shownCount.requirements}/${shownCount.sections}`}>
                    {shownCount.requirements} requirements · {shownCount.sections} sections
                  </span>
                </div>

                <ol className="lx-vfy-structured" aria-label="Structured checklist" data-editing={editing || undefined}>
                  {shownSections.map((section, sectionIndex) => (
                    <li key={section.title}>
                      <p className="lx-vfy-structured__section">{section.title} <span>· {section.requirements.length}</span></p>
                      <ul>
                        {(structuredState === "ready" || editing ? section.requirements : section.requirements.slice(0, 2)).map((r) => (
                          <li key={r.id} className="lx-vfy-req-row" data-vfy-req={r.id}>
                            <span className="lx-vfy-req-id">{r.id}</span>
                            {editing ? (
                              confirmRemove === r.id ? (
                                <span className="lx-vfy-confirm" role="group" aria-label={`Remove ${r.id}?`}>
                                  <span>Remove {r.id}?</span>
                                  <Button type="button" variant="destructiveGhost" size="sm" onClick={() => {
                                    updateDraft((sections) => sections.map((s) => ({ ...s, requirements: s.requirements.filter((x) => x.id !== r.id) })));
                                    setConfirmRemove(null);
                                  }}>Remove</Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRemove(null)}>Keep</Button>
                                </span>
                              ) : (
                                <>
                                  <input
                                    className="lx-vfy-req-input"
                                    value={r.text}
                                    data-vfy-req-input={r.id}
                                    aria-label={`${r.id} requirement`}
                                    aria-invalid={editError?.includes(r.id) ? true : undefined}
                                    placeholder="Describe the requirement"
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      updateDraft((sections) => sections.map((s) => ({ ...s, requirements: s.requirements.map((x) => (x.id === r.id ? { ...x, text } : x)) })));
                                    }}
                                  />
                                  <button type="button" className="lx-vfy-icon-btn lx-vfy-icon-btn--sm" aria-label={`Remove ${r.id}`} title={`Remove ${r.id}`} onClick={() => setConfirmRemove(r.id)}>
                                    <Trash2 size={14} aria-hidden />
                                  </button>
                                </>
                              )
                            ) : (
                              <span className="lx-vfy-req-text">{r.text}</span>
                            )}
                          </li>
                        ))}
                        {structuredState !== "ready" && !editing && section.requirements.length > 2 ? (
                          <li className="lx-vfy-structured__more">+{section.requirements.length - 2} more</li>
                        ) : null}
                        {!section.requirements.length && !editing ? <li className="lx-vfy-structured__more">No requirements</li> : null}
                      </ul>
                      {editing ? (
                        <button type="button" className="lx-vfy-add" onClick={() => addRequirement(sectionIndex)}>
                          <Plus size={13} aria-hidden /> Add requirement
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ol>

                {editError ? <p className="lx-vfy-error" role="alert">{editError}</p> : null}
                <div className="lx-vfy-row">
                  {editing ? (
                    <>
                      <span className="lx-vfy-hint">{hasUnsavedEdits ? "Unsaved changes · only this review uses them" : "Only this review uses your changes"}</span>
                      <span className="lx-vfy-row__actions">
                        <Button type="button" variant="ghost" size="sm" onClick={cancelEdits}>Cancel</Button>
                        <Button type="button" variant="primary" size="sm" onClick={applyEdits} data-vfy-apply="">Apply changes</Button>
                      </span>
                    </>
                  ) : structuredState === "ready" ? (
                    <>
                      <span className="lx-vfy-ready" role="status"><CheckCircle2 size={14} aria-hidden /> Checklist ready</span>
                      <span className="lx-vfy-row__actions">
                        {isEdited ? <Button type="button" variant="ghost" size="sm" onClick={resetToOriginal}>Reset</Button> : null}
                        <Button type="button" variant="secondary" size="sm" onClick={startEditing} data-vfy-edit="">
                          <PenLine size={14} aria-hidden /> Edit checklist
                        </Button>
                      </span>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="secondary" size="sm" onClick={prepareStructured} disabled={structuredState === "preparing"}>
                        {structuredState === "preparing" ? <Loader2 size={14} className="lx-vfy-spin" aria-hidden /> : <ShieldCheck size={14} aria-hidden />}
                        {structuredState === "preparing" ? "Preparing…" : "Prepare checklist"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={editStructuredManually}>
                        <PenLine size={14} aria-hidden /> Edit as manual rules
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {source === "manual" ? (
              <div className="lx-vfy-panel" role="tabpanel" id="lx-vfy-panel-manual" aria-labelledby="lx-vfy-tab-manual">
                <div className="lx-vfy-structured__head">
                  <label className="lx-vfy-label" htmlFor="lx-vfy-manual">Checklist rules</label>
                  <span className="lx-vfy-count" aria-live="polite" data-vfy-manual-count={manualRules.length}>
                    {manualRules.length} requirement{manualRules.length === 1 ? "" : "s"}
                  </span>
                </div>
                <textarea
                  id="lx-vfy-manual"
                  className="lx-vfy-textarea"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={"One rule per line, for example:\nPersonal data breaches are notified within 72 hours."}
                  aria-invalid={attempted && manualRules.length === 0 ? true : undefined}
                />
                <div className="lx-vfy-row">
                  <p className="lx-vfy-hint">Each line becomes one requirement.</p>
                  {!manualText.trim() ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setManualText(VERIFAI_MANUAL_SAMPLE)}>Use example rules</Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="lx-vfy-modal__col lx-vfy-modal__col--target" aria-labelledby="lx-vfy-target-title">
            <h3 id="lx-vfy-target-title" className="lx-vfy-overline">Target document</h3>

            {isGalaxy ? (
              <>
                <label className="lx-vfy-label" htmlFor="lx-vfy-scope">Constellation file scope</label>
                <select
                  id="lx-vfy-scope"
                  className="lx-vfy-select"
                  value={scopeId}
                  disabled={constellations.length === 0}
                  onChange={(e) => {
                    setScopeId(e.target.value);
                    setDocumentId(verifaiScopeDocuments(e.target.value)[0].id);
                    setDocError(null);
                  }}
                >
                  {constellations.length === 0 ? <option value="">No Constellation available</option> : null}
                  {constellations.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </>
            ) : scope ? (
              <p className="lx-vfy-scope-note">Files from <strong>{scope.label}</strong></p>
            ) : null}

            {scope ? (
              <>
                {targetDocument ? (
                  <div className="lx-vfy-doc-card" data-vfy-selected-doc={targetDocument.name}>
                    <span className="lx-vfy-doc-card__icon" aria-hidden><FileText size={20} /></span>
                    <div className="min-w-0">
                      <p className="lx-vfy-file-card__name" title={targetDocument.name}>{targetDocument.name}</p>
                      <p className="lx-vfy-file-card__meta">PDF · {targetDocument.pages} page{targetDocument.pages === 1 ? "" : "s"} · {targetDocument.sizeLabel}</p>
                      <p className="lx-vfy-file-card__meta">{targetDocument.origin === "upload" ? "Uploaded for this review" : targetDocument.updated}</p>
                    </div>
                  </div>
                ) : (
                  <div className="lx-vfy-doc-card lx-vfy-doc-card--empty">
                    <FileText size={18} aria-hidden />
                    <p className="lx-vfy-file-card__meta">No document selected</p>
                  </div>
                )}

                <label className="lx-vfy-label" htmlFor="lx-vfy-doc-select">Target document</label>
                <select id="lx-vfy-doc-select" className="lx-vfy-select" value={documentId} onChange={(e) => setDocumentId(e.target.value)} disabled={Boolean(docUpload)}>
                  {documents.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                {docUpload ? (
                  <div className="lx-vfy-upload-progress" role="status" aria-label={`Uploading ${docUpload.name}`}>
                    <p className="lx-vfy-status"><Loader2 size={14} className="lx-vfy-spin" aria-hidden /> Uploading “{docUpload.name}”… {docUpload.progress}%</p>
                    <div className="lx-vfy-bar"><span style={{ width: `${docUpload.progress}%` }} /></div>
                  </div>
                ) : null}
                <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" hidden onChange={handlePdfFile} data-vfy-pdf-input="" />
                <Button type="button" variant="secondary" size="sm" className="lx-vfy-upload-btn" onClick={() => pdfInputRef.current?.click()} disabled={Boolean(docUpload)}>
                  <Upload size={14} aria-hidden /> Upload PDF document
                </Button>
                {docError ? <p className="lx-vfy-error" role="alert">{docError}</p> : null}
              </>
            ) : (
              <div className="lx-vfy-empty">
                <p className="lx-vfy-file-card__name">No Constellation available</p>
                <p className="lx-vfy-hint">You need Use access to a Constellation in this Project to verify its files.</p>
              </div>
            )}

            <div className="lx-vfy-modal__start">
              <Button
                type="button"
                variant="primary"
                className="lx-vfy-start"
                onClick={handleStart}
                data-blocked={blocker ? "" : undefined}
                aria-describedby={blocker ? "lx-vfy-blocker" : "lx-vfy-ready-note"}
              >
                <ShieldCheck size={16} aria-hidden /> Start Verification
              </Button>
              {blocker ? (
                <p id="lx-vfy-blocker" className={attempted ? "lx-vfy-error" : "lx-vfy-hint"} role={attempted ? "alert" : undefined}>{blocker}</p>
              ) : checklist && targetDocument ? (
                <p id="lx-vfy-ready-note" className="lx-vfy-hint">{checklist.requirementCount} requirements · {targetDocument.name}</p>
              ) : null}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
