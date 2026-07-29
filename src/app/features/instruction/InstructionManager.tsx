import { Cpu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { INSTRUCTION_MAX_CHARS } from "./constants";
import { DiscardInstructionChangesDialog } from "./DiscardInstructionChangesDialog";
import { InstructionAttachment } from "./InstructionAttachment";
import { LX } from "./tokens";
import type { InstructionData } from "./types";
import { formatCharacterCount, instructionSignature } from "./utils";

export function InstructionManager({
    open,
    data,
    onCommit,
    onCancel,
    showAttachment = true,
}: {
    open: boolean;
    data: InstructionData;
    onCommit: (next: InstructionData) => void;
    onCancel: () => void;
    showAttachment?: boolean;
}) {
    const [draft, setDraft] = useState<InstructionData>(data);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const initialRef = useRef<InstructionData>(data);

    useEffect(() => {
        if (!open) return;
        const snapshot = { ...data, attachment: data.attachment ? { ...data.attachment } : null };
        initialRef.current = snapshot;
        setDraft(snapshot);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
    }, [open, data]);

    const dirty = instructionSignature(draft) !== instructionSignature(initialRef.current);

    function requestClose() {
        if (dirty) {
            setDiscardOpen(true);
            return;
        }
        onCancel();
    }

    function handleTextChange(value: string) {
        if (value.length > INSTRUCTION_MAX_CHARS) return;
        setDraft((current) => ({ ...current, text: value }));
    }

    function save() {
        if (!dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            onCommit({
                text: draft.text,
                attachment: draft.attachment ? { ...draft.attachment } : null,
            });
            setSaving(false);
            onCancel();
        }, 500);
    }

    if (!open) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
                <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 720px)", maxWidth: "min(92vw, 720px)", maxHeight: "88vh" }}>
                    <div className="flex max-h-[88vh] flex-col">
                        <DialogHeader className="flex-shrink-0 border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                                    <Cpu size={18} color={LX.secondary} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>Instruction</DialogTitle>
                                    <DialogDescription className="mt-1 luxia-type-metadata" style={{ color: LX.textMuted }}>Changes are local until saved.</DialogDescription>
                                </div>
                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close instruction manager" onClick={requestClose}>
                                    <X size={15} style={{ color: LX.textMuted }} />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                            <div className="space-y-4">
                                {showAttachment ? (
                                    <InstructionAttachment
                                        attachment={draft.attachment}
                                        onAttach={(attachment) => setDraft((current) => ({ ...current, attachment }))}
                                        onRemove={() => setDraft((current) => ({ ...current, attachment: null }))}
                                    />
                                ) : null}

                                <div className="relative">
                                    <Textarea
                                        value={draft.text}
                                        onChange={(event) => handleTextChange(event.target.value)}
                                        placeholder="Write instructions for this constellation…"
                                        rows={12}
                                        className="min-h-[220px] resize-y rounded-[12px] pb-8 luxia-type-body-small"
                                        aria-label="Instruction text"
                                        aria-describedby="instruction-char-count"
                                    />
                                    <p
                                        id="instruction-char-count"
                                        className="pointer-events-none absolute bottom-2.5 right-3 luxia-type-caption"
                                        style={{ color: LX.textMuted }}
                                        aria-live="polite"
                                    >
                                        {formatCharacterCount(draft.text.length)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                            {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                            <div className="flex items-center justify-between gap-3">
                                <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                                    {dirty ? "Unsaved changes" : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={requestClose}>Cancel</Button>
                                    <Button type="button" className="min-w-[132px] rounded-full px-4" disabled={!dirty || saving} onClick={save}>
                                        {saving ? "Saving…" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DiscardInstructionChangesDialog
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                onDiscard={() => { setDiscardOpen(false); onCancel(); }}
            />
        </>
    );
}
