import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { DataSourceConnector } from "@/app/features/permissions/types";
import { DataSourceTypeIcon } from "./DataSourceTypeIcon";
import {
  CONNECTOR_GROUPS,
  DATA_SOURCE_CONNECTORS,
  PROTOTYPE_PLACEHOLDER_CONNECTORS,
  getConnectorOption,
} from "./connectors";
import { DataSourceOwnershipField } from "./DataSourceOwnershipField";
import { DataSourceDetailsSection } from "./DataSourceDetailsSection";
import type { DataSourceOwnershipChoice } from "./types";
import type { DraftDataSourceTagsApi } from "@/app/features/document-tags";

export interface NewDataSourceChooserDialogProps {
  open: boolean;
  connector: DataSourceConnector | null;
  name: string;
  ownership: DataSourceOwnershipChoice;
  allowOrganizational: boolean;
  onConnectorChange: (connector: DataSourceConnector) => void;
  onNameChange: (name: string) => void;
  onOwnershipChange: (ownership: DataSourceOwnershipChoice) => void;
  onCancel: () => void;
  onNext: () => void;
  tagDraft: DraftDataSourceTagsApi;
}

export function NewDataSourceChooserDialog({
  open,
  connector,
  name,
  ownership,
  allowOrganizational,
  onConnectorChange,
  onNameChange,
  onOwnershipChange,
  onCancel,
  onNext,
  tagDraft,
}: NewDataSourceChooserDialogProps) {
  const nameTrimmed = name.trim();
  const canContinue = Boolean(connector && nameTrimmed);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,42rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>New Data Source</DialogTitle>
          <DialogDescription>
            Choose the type of Data Source you want to connect.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {CONNECTOR_GROUPS.map((group) => {
            const options = DATA_SOURCE_CONNECTORS.filter((item) => item.group === group.id);
            const placeholders = PROTOTYPE_PLACEHOLDER_CONNECTORS.filter(
              (item) => item.group === group.id,
            );
            return (
              <div key={group.id}>
                <p className="mb-2 luxia-type-caption text-[var(--luxia-text-secondary)]">
                  {group.label}
                </p>
                <div
                  role="radiogroup"
                  aria-label={group.label}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {options.map((option) => {
                    const selected = connector === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={option.label}
                        onClick={() => onConnectorChange(option.id)}
                        onKeyDown={(event) => {
                          if (event.key === " " || event.key === "Enter") {
                            event.preventDefault();
                            onConnectorChange(option.id);
                          }
                        }}
                        className={`group flex items-start gap-2.5 rounded-[var(--luxia-radius-control)] border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
                          selected
                            ? "border-[var(--luxia-border-focus)] bg-[var(--luxia-surface-selected,var(--luxia-surface-muted))]"
                            : "border-[var(--luxia-border-subtle)] bg-[var(--luxia-surface-elevated)] hover:border-[var(--luxia-border-strong)]"
                        }`}
                      >
                        <DataSourceTypeIcon id={option.id} selected={selected} />
                        <span className="min-w-0">
                          <span className="block luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                            {option.label}
                          </span>
                          {option.helper ? (
                            <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-muted)]">
                              {option.helper}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                  {placeholders.map((option) => {
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled
                        aria-disabled="true"
                        title={option.unavailableReason}
                        className="flex cursor-not-allowed items-start gap-2.5 rounded-[var(--luxia-radius-control)] border px-3 py-2.5 text-left opacity-55"
                        style={{
                          borderColor: "var(--luxia-border-subtle)",
                          background: "var(--luxia-surface-elevated)",
                        }}
                      >
                        <DataSourceTypeIcon id={option.id} disabled />
                        <span className="min-w-0">
                          <span className="block luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-muted)]">
                            Not available in this prototype
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <DataSourceDetailsSection tagDraft={tagDraft}>
            <div className="space-y-2">
              <Label htmlFor="ds-create-name">Data Source name</Label>
              <Input
                id="ds-create-name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Data source name 01"
                autoComplete="off"
              />
            </div>

            <DataSourceOwnershipField
              value={ownership}
              onChange={onOwnershipChange}
              allowOrganizational={allowOrganizational}
            />
          </DataSourceDetailsSection>

          {connector ? (
            <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
              Selected: {getConnectorOption(connector)?.label}
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="secondary" size="compact" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!canContinue}
            onClick={onNext}
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
