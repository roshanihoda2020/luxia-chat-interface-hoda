import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";

export function DiscardInstructionChangesDialog({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}) {
  return (
    <DiscardChangesDialog
      open={open}
      onOpenChange={onOpenChange}
      onDiscard={onDiscard}
    />
  );
}
