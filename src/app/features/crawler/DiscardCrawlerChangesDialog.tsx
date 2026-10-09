import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";

export function DiscardCrawlerChangesDialog({
  open,
  onOpenChange,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
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
