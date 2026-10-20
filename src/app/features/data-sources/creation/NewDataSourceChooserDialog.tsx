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
import { DraftDataSourceTagsField, type DraftDataSourceTagsApi } from "@/app/features/document-tags";
import { DataSourceTypeIcon } from "./DataSourceTypeIcon";
import {
  CONNECTOR_GROUPS,
  DATA_SOURCE_CONNECTORS,
  PROTOTYPE_PLACEHOLDER_CONNECTORS,
  getConnectorOption,
  type DataSourceConnectorOption,
  type DataSourceTypeIconId,
  type PrototypePlaceholderConnector,
} from "./connectors";
import { DataSourceOwnershipField } from "./DataSourceOwnershipField";
import type { DataSourceOwnershipChoice } from "./types";

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
  const selectedOption = getConnectorOption(connector);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[min(92vh,40rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl [&>button]:!right-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>New Data Source</DialogTitle>
          <DialogDescription>
            Choose a type and set the basic details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto md:flex-row">
          <div className="min-w-0 px-6 py-4 md:flex-1">
            <DataSourceTypeChooser
              connector={connector}
              onConnectorChange={onConnectorChange}
            />
          </div>

          <div
            className="min-w-0 border-t px-6 py-4 md:w-[22rem] md:shrink-0 md:border-t-0 md:border-l"
            style={{
              borderColor: "var(--luxia-border-subtle)",
              background: "var(--luxia-opacity-brand-primary-04)",
            }}
          >
            <DataSourceChooserDetails
              selectedOption={selectedOption}
              name={name}
              ownership={ownership}
              allowOrganizational={allowOrganizational}
              tagDraft={tagDraft}
              onNameChange={onNameChange}
              onOwnershipChange={onOwnershipChange}
            />
          </div>
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

function DataSourceTypeChooser({
  connector,
  onConnectorChange,
}: {
  connector: DataSourceConnector | null;
  onConnectorChange: (connector: DataSourceConnector) => void;
}) {
  return (
    <section aria-labelledby="ds-chooser-type-heading">
      <h3
        id="ds-chooser-type-heading"
        className="luxia-type-title-section border-b border-[var(--luxia-border-subtle)] pb-3 text-[var(--luxia-text-primary)]"
      >
        Choose data source type
      </h3>
      <div className="mt-6 space-y-5">
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
                {options.map((option) => (
                  <DataSourceTypeCard
                    key={option.id}
                    option={option}
                    selected={connector === option.id}
                    onSelect={() => onConnectorChange(option.id)}
                  />
                ))}
                {placeholders.map((option) => (
                  <DataSourceTypePlaceholder key={option.id} option={option} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ConnectorIconSlot({
  id,
  selected = false,
  disabled = false,
}: {
  id: DataSourceTypeIconId;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center">
      <DataSourceTypeIcon id={id} size={20} selected={selected} disabled={disabled} align="center" />
    </span>
  );
}

function DataSourceTypeCard({
  option,
  selected,
  onSelect,
}: {
  option: DataSourceConnectorOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={option.label}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group flex items-center gap-2 rounded-[var(--luxia-radius-control)] border px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
        selected
          ? "border-[var(--luxia-border-focus)] bg-[var(--luxia-opacity-brand-secondary-08)] shadow-none"
          : "border-[var(--luxia-border-subtle)] bg-[var(--luxia-surface-elevated)] shadow-none hover:border-[var(--luxia-border-strong)]"
      }`}
    >
      <ConnectorIconSlot id={option.id} selected={selected} />
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
}

function DataSourceTypePlaceholder({
  option,
}: {
  option: PrototypePlaceholderConnector;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={option.unavailableReason}
      className="flex cursor-not-allowed items-center gap-2 rounded-[var(--luxia-radius-control)] border px-2.5 py-2 text-left opacity-55 shadow-none"
      style={{
        borderColor: "var(--luxia-border-subtle)",
        background: "var(--luxia-surface-elevated)",
      }}
    >
      <ConnectorIconSlot id={option.id} disabled />
      <span className="min-w-0">
        <span className="block luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
          {option.label}
        </span>
        <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-muted)]">
          Not available yet
        </span>
      </span>
    </button>
  );
}

function DataSourceChooserDetails({
  selectedOption,
  name,
  ownership,
  allowOrganizational,
  tagDraft,
  onNameChange,
  onOwnershipChange,
}: {
  selectedOption: DataSourceConnectorOption | undefined;
  name: string;
  ownership: DataSourceOwnershipChoice;
  allowOrganizational: boolean;
  tagDraft: DraftDataSourceTagsApi;
  onNameChange: (name: string) => void;
  onOwnershipChange: (ownership: DataSourceOwnershipChoice) => void;
}) {
  return (
    <section aria-labelledby="ds-chooser-details-heading">
      <h3
        id="ds-chooser-details-heading"
        className="luxia-type-title-section border-b border-[var(--luxia-border-subtle)] pb-3 text-[var(--luxia-text-primary)]"
      >
        Data Source details
      </h3>

      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ds-create-name" className="text-[var(--luxia-text-primary)]">
            Data Source name
          </Label>
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

        {selectedOption ? (
          <DraftDataSourceTagsField
            draft={tagDraft}
            labeledAdd
            quiet
            titleClassName="luxia-type-label-form text-[var(--luxia-text-primary)]"
            addTriggerClassName="!h-[22px] !min-h-[22px] !gap-1 !rounded-[var(--luxia-radius-8)] !px-2 !text-[12px] !leading-4"
            listClassName="mt-2 flex w-full items-center gap-2"
            chipClassName="max-w-full"
          />
        ) : null}
      </div>
    </section>
  );
}
