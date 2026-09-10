import { useId, type ReactNode } from "react";
import {
  DraftDataSourceTagsField,
  type DraftDataSourceTagsApi,
} from "@/app/features/document-tags";

export function DataSourceDetailsSection({
  tagDraft,
  includeTags = true,
  children,
  heading = "Data Source details",
}: {
  tagDraft?: DraftDataSourceTagsApi;
  includeTags?: boolean;
  children?: ReactNode;
  heading?: string;
}) {
  const headingId = useId();
  const showTags = includeTags && tagDraft;

  return (
    <section className="luxia-creation-field-group" aria-labelledby={headingId}>
      <div className="luxia-creation-field-group-header">
        <h3 id={headingId} className="luxia-creation-field-group-title luxia-type-body-dense-strong">
          {heading}
        </h3>
      </div>
      <div className="luxia-creation-field-group-body">
        <div className="luxia-creation-ds-details">
          <div
            className={
              showTags
                ? "luxia-creation-ds-details-grid"
                : "luxia-creation-ds-details-grid luxia-creation-ds-details-grid--two"
            }
          >
            {children}
            {showTags ? <DraftDataSourceTagsField draft={tagDraft} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DataSourceDetailsSummary({
  name,
  ownershipLabel,
}: {
  name: string;
  ownershipLabel: string;
}) {
  return (
    <>
      <div className="min-w-0">
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Data Source name
        </p>
        <p
          className="mt-1 truncate luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
          title={name}
        >
          {name}
        </p>
      </div>
      <div className="min-w-0">
        <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          Ownership
        </p>
        <p
          className="mt-1 luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {ownershipLabel}
        </p>
      </div>
    </>
  );
}

export function DataSourceCreationSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const headingId = useId();

  return (
    <section className="luxia-creation-field-group" aria-labelledby={headingId}>
      <div className="luxia-creation-field-group-header">
        <h3 id={headingId} className="luxia-creation-field-group-title luxia-type-body-dense-strong">
          {title}
        </h3>
      </div>
      <div className="luxia-creation-field-group-body">{children}</div>
    </section>
  );
}
