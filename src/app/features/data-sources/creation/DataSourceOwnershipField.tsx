import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import type { DataSourceOwnershipChoice } from "./types";

export function DataSourceOwnershipField({
  value,
  onChange,
  allowOrganizational,
}: {
  value: DataSourceOwnershipChoice | null;
  onChange: (value: DataSourceOwnershipChoice) => void;
  allowOrganizational: boolean;
}) {
  return (
    <fieldset className="luxia-creation-ownership-fieldset luxia-creation-ownership--quiet min-w-0 border-0 p-0">
      <legend className="mb-2 luxia-type-label-form text-[var(--luxia-text-primary)]">
        Ownership
      </legend>
      <RadioGroup
        value={value ?? ""}
        onValueChange={(next) => onChange(next as DataSourceOwnershipChoice)}
        className="luxia-creation-ownership-list flex flex-col gap-0"
        aria-label="Ownership"
      >
        {allowOrganizational ? (
          <>
            <label
              className={`luxia-creation-ownership-row${value === "organizational" ? " is-selected" : ""}`}
              htmlFor="ds-ownership-org"
            >
              <RadioGroupItem
                value="organizational"
                id="ds-ownership-org"
                aria-describedby="ds-ownership-org-desc"
                className="luxia-creation-ownership-row-radio shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="luxia-creation-ownership-row-title">Organizational</span>
                <p id="ds-ownership-org-desc" className="luxia-creation-ownership-row-desc">
                  Managed through organizational access rules and Access Levels.
                </p>
              </span>
            </label>
            <div className="luxia-creation-ownership-divider" role="presentation" />
          </>
        ) : null}
        <label
          className={`luxia-creation-ownership-row${value === "private" ? " is-selected" : ""}`}
          htmlFor="ds-ownership-private"
        >
          <RadioGroupItem
            value="private"
            id="ds-ownership-private"
            aria-describedby="ds-ownership-private-desc"
            className="luxia-creation-ownership-row-radio shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="luxia-creation-ownership-row-title">Private</span>
            <p id="ds-ownership-private-desc" className="luxia-creation-ownership-row-desc">
              Owned by you and private by default.
            </p>
          </span>
        </label>
      </RadioGroup>
      {!allowOrganizational ? (
        <p className="mt-2 luxia-type-caption text-[var(--luxia-text-muted)]">
          Organizational sources can be created by Organization Admins.
        </p>
      ) : null}
    </fieldset>
  );
}
