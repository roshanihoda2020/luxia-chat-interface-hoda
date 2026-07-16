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
import { LX } from "./tokens";

export function RemoveExtraContextFileDialog({
    open,
    fileName,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    fileName: string;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove extra context file?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {fileName ? `"${fileName}" will be removed from this configuration. The original file will not be deleted.` : "This file will be removed from this configuration. The original file will not be deleted."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction style={{ background: LX.error }} className="text-white hover:opacity-90" onClick={onConfirm}>
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
