import { Cpu, X } from "lucide-react";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/app/components/ui/utils";
import { BusyButton } from "@/app/features/shared/Loading";
import { LUXIA_DIALOG_CLOSE_ON_DARK_CLASS } from "@/app/features/shared/structuredModalChrome";
import { LUXIA_DIRTY_STATE_COPY } from "@/app/features/shared/luxiaSettingsUx";
import { useManagerLeaveRegistration } from "@/app/features/shared/unsavedNavigationGuard";
import { INSTRUCTION_MAX_CHARS } from "./constants";
import { DiscardInstructionChangesDialog } from "./DiscardInstructionChangesDialog";
import { LX } from "./tokens";
import type { InstructionData } from "./types";
import { formatCharacterCount, instructionSignature } from "./utils";

function cloneInstruction(data: InstructionData): InstructionData {
    return {
        text: data.text,
        attachment: data.attachment ? { ...data.attachment } : null,
    };
}

export function InstructionManager({
    open,
    data,
    onCommit,
    onCancel,
    presentation = "dialog",
    closeRef,
    dirtyRef,
    hideChrome,
}: {
    open: boolean;
    data: InstructionData;
    onCommit: (next: InstructionData) => void;
    onCancel: () => void;
    presentation?: "dialog" | "page";
    closeRef?: MutableRefObject<(() => void) | null>;
    dirtyRef?: MutableRefObject<boolean>;
    hideChrome?: boolean;
}) {
    const isPage = presentation === "page";
    const effectiveOpen = isPage ? true : open;
    const showHeaderChrome = !hideChrome && !isPage;
    const [draft, setDraft] = useState<InstructionData>(() => cloneInstruction(data));
    const [discardOpen, setDiscardOpen] = useState(false);
    const [discardIntent, setDiscardIntent] = useState<"leave" | "reset">("leave");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveNotice, setSaveNotice] = useState<string | null>(null);
    const initialRef = useRef<InstructionData>(cloneInstruction(data));

    useEffect(() => {
        if (!effectiveOpen) return;
        const snapshot = cloneInstruction(data);
        initialRef.current = snapshot;
        setDraft(snapshot);
        setDiscardOpen(false);
        setSaving(false);
        setSaveError(null);
        setSaveNotice(null);
    }, [effectiveOpen, data]);

    const dirty = instructionSignature(draft) !== instructionSignature(initialRef.current);

    function resetDraft() {
        const snapshot = cloneInstruction(initialRef.current);
        setDraft(snapshot);
        setSaveError(null);
        setSaveNotice(null);
    }

    /** Leave the manager (dialog close or page Back). */
    function requestLeave() {
        if (dirty) {
            setDiscardIntent("leave");
            setDiscardOpen(true);
            return;
        }
        onCancel();
    }

    /** Cancel edits: stay on page in page mode; leave in dialog mode. */
    function requestCancelEdits() {
        if (!dirty) {
            if (!isPage) onCancel();
            return;
        }
        if (isPage) {
            setDiscardIntent("reset");
            setDiscardOpen(true);
            return;
        }
        setDiscardIntent("leave");
        setDiscardOpen(true);
    }

    useManagerLeaveRegistration({ closeRef, dirtyRef, dirty, requestLeave });

    function handleTextChange(value: string) {
        if (value.length > INSTRUCTION_MAX_CHARS) return;
        setDraft((current) => ({ ...current, text: value }));
        setSaveNotice(null);
    }

    function save() {
        if (!dirty || saving) return;
        setSaving(true);
        setSaveError(null);
        window.setTimeout(() => {
            const next = cloneInstruction(draft);
            onCommit(next);
            initialRef.current = next;
            setDraft(next);
            setSaving(false);
            setSaveNotice(LUXIA_DIRTY_STATE_COPY.saveSuccess);
            if (!isPage) onCancel();
        }, 500);
    }

    if (!effectiveOpen) return null;

    const shell = (
        <div className={isPage ? "flex min-h-0 flex-1 flex-col" : "flex max-h-[min(88vh,640px)] flex-col"}>
            {showHeaderChrome ? (
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px]" style={{ background: LX.blueT10 }}>
                            <Cpu size={18} color={LX.secondary} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="luxia-type-title-modal">Instruction</DialogTitle>
                            <DialogDescription className="mt-1.5 luxia-type-metadata">
                                Write guidance for how this constellation should respond. Changes are local until saved.
                            </DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn("h-9 w-9", LUXIA_DIALOG_CLOSE_ON_DARK_CLASS)}
                            aria-label="Close instruction manager"
                            onClick={requestLeave}
                        >
                            <X size={15} />
                        </Button>
                    </div>
                </DialogHeader>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                <div className="relative">
                    <Textarea
                        value={draft.text}
                        onChange={(event) => handleTextChange(event.target.value)}
                        placeholder="Write instructions for this constellation…"
                        rows={14}
                        className="min-h-[280px] resize-y rounded-[12px] pb-8 luxia-type-body-small"
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

            <div className="flex-shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
                {saveError ? <p className="mb-3 luxia-type-metadata" role="alert" style={{ color: LX.error }}>{saveError}</p> : null}
                {saveNotice && !dirty ? (
                    <p className="mb-3 luxia-type-metadata" role="status" aria-live="polite" style={{ color: LX.textMuted }}>
                        {saveNotice}
                    </p>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                    <span className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                        {dirty ? "Unsaved changes" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                        {dirty || !isPage ? (
                            <Button type="button" variant="secondary" className="px-4" onClick={requestCancelEdits}>
                                Cancel
                            </Button>
                        ) : null}
                        <BusyButton
                            type="button"
                            variant="primary"
                            className="min-w-[132px] px-4 !bg-[var(--luxia-purple-70)] !bg-none disabled:!opacity-[0.45]"
                            disabled={!dirty}
                            busy={saving}
                            busyLabel="Saving…"
                            busyText="Saving…"
                            onClick={save}
                        >
                            Save Changes
                        </BusyButton>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {isPage ? (
                <div className="flex flex-col overflow-hidden rounded-[12px] border" style={{ borderColor: LX.border }}>
                    {shell}
                </div>
            ) : (
                <Dialog open={open} onOpenChange={(next) => { if (!next) requestLeave(); }}>
                    <DialogContent
                        hideCloseButton
                        className="overflow-hidden p-0"
                        style={{ width: "min(92vw, 640px)", maxWidth: "min(92vw, 640px)", maxHeight: "min(88vh, 640px)" }}
                    >
                        {shell}
                    </DialogContent>
                </Dialog>
            )}

            <DiscardInstructionChangesDialog
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                onDiscard={() => {
                    setDiscardOpen(false);
                    if (discardIntent === "reset") {
                        resetDraft();
                        return;
                    }
                    onCancel();
                }}
            />
        </>
    );
}
