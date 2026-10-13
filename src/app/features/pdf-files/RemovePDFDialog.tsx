import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { DESTRUCTIVE_CONFIRM } from "@/app/features/shared/destructiveConfirmCopy";

export function RemovePDFDialog({
    open,
    onOpenChange,
    onConfirm,
    busy = false,
    chrome = "compact",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    busy?: boolean;
    chrome?: "standard" | "compact";
}) {
    const copy = DESTRUCTIVE_CONFIRM.pdf;
    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(next) => {
                if (!next && busy) return;
                onOpenChange(next);
            }}
            tone="destructive"
            chrome={chrome}
            title={copy.title}
            description={copy.description}
            cancelLabel="Cancel"
            confirmLabel={copy.confirmLabel}
            busy={busy}
            busyLabel={copy.busyLabel}
            onConfirm={onConfirm}
        />
    );
}
