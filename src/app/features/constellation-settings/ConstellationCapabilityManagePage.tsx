import { useMemo, useRef, useState } from "react";
import {
  LuxiaBreadcrumb,
  buildConstellationCapabilityBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
  LuxiaPageHeadingRegion,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageReadOnlyBadge } from "@/app/components/LuxiaPageReadOnlyBadge";
import {
  LuxiaPageGuide,
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { ActiveDataTablesManager } from "@/app/features/active-data-tables/ActiveDataTablesManager";
import { TABLE_CATALOG } from "@/app/features/active-data-tables/data";
import { ConfigureColumnsDialog } from "@/app/features/active-data-tables/ConfigureColumnsDialog";
import { EditTableDetailsDialog } from "@/app/features/active-data-tables/EditTableDetailsDialog";
import { TablePreviewDrawer } from "@/app/features/active-data-tables/TablePreviewDrawer";
import type { DataTableRecord } from "@/app/features/active-data-tables/types";
import {
  capabilityMetaForType,
  isCapsuleCapabilityAllowed,
  type CapsuleCapabilityId,
  type CapsuleConstellationType,
} from "@/app/features/constellation/capsuleCapabilities";
import { constellationTypeLabel } from "./types";
import { CrawlerManager } from "@/app/features/crawler/CrawlerManager";
import type { CrawlerState } from "@/app/features/crawler/types";
import { ExtraContextFilesManager } from "@/app/features/extra-context-files/ExtraContextFilesManager";
import type { ExtraContextFile } from "@/app/features/extra-context-files/types";
import { HS } from "@/app/features/home/homeSurfaces";
import { InstructionManager } from "@/app/features/instruction/InstructionManager";
import type { InstructionData } from "@/app/features/instruction/types";
import { KnowledgeBaseManager } from "@/app/features/knowledge-base/KnowledgeBaseManager";
import type { KnowledgeBaseEntry } from "@/app/features/knowledge-base/data";
import { MetricsManager } from "@/app/features/metrics/MetricsManager";
import type { MetricRecord } from "@/app/features/metrics/types";
import { PDFFilesManager } from "@/app/features/pdf-files/PDFFilesManager";
import type { PDFFileRecord } from "@/app/features/pdf-files/types";
import { RelationshipManager } from "@/app/features/relationship/RelationshipManager";
import type { RelationshipRecord } from "@/app/features/relationship/types";
import {
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import type { ConstellationCapabilityBundle } from "./capabilityState";
import { CONSTELLATION_SETTINGS_PAGE_VARIANT } from "./ia";

export interface ConstellationCapabilityManagePageProps {
  project: { id: string; name: string };
  constellation: {
    id: string;
    name: string;
    type: CapsuleConstellationType;
    status: string;
  };
  capabilityId: CapsuleCapabilityId;
  bundle: ConstellationCapabilityBundle;
  onUpdateBundle: (next: ConstellationCapabilityBundle) => void;
  readOnly?: boolean;
  unavailable?: boolean;
  unavailableReason?: string;
  onBackToSettings: () => void;
  onNavigateHome: () => void;
  onOpenProject: (id: string) => void;
  onOpenConstellations: (id: string) => void;
  onOpenConstellation: (projectId: string, constellationId: string) => void;
  connectedSourceIds?: readonly string[];
}

export function ConstellationCapabilityManagePage({
  project,
  constellation,
  capabilityId,
  bundle,
  onUpdateBundle,
  readOnly = false,
  unavailable = false,
  unavailableReason,
  onBackToSettings,
  onNavigateHome,
  onOpenProject,
  onOpenConstellations,
  onOpenConstellation,
  connectedSourceIds = [],
}: ConstellationCapabilityManagePageProps) {
  const capabilityMeta = capabilityMetaForType(capabilityId, constellation.type);
  const CapabilityIcon = capabilityMeta.icon;
  const allowed = isCapsuleCapabilityAllowed(capabilityId, constellation.type);
  const closeRef = useRef<(() => void) | null>(null);
  const leaveActionRef = useRef(onBackToSettings);
  leaveActionRef.current = onBackToSettings;

  const commitBundle = (next: ConstellationCapabilityBundle) => {
    if (readOnly) return;
    onUpdateBundle(next);
  };

  const [previewTableId, setPreviewTableId] = useState<string | null>(null);
  const [detailsTableId, setDetailsTableId] = useState<string | null>(null);
  const [columnsTableId, setColumnsTableId] = useState<string | null>(null);

  const openPreviewTable = bundle.tables.find((table) => table.id === previewTableId) ?? null;
  const openDetailsTable = bundle.tables.find((table) => table.id === detailsTableId) ?? null;
  const openColumnsTable = bundle.tables.find((table) => table.id === columnsTableId) ?? null;

  const breadcrumbItems = buildConstellationCapabilityBreadcrumbItems({
    projectId: project.id,
    projectName: project.name,
    constellationId: constellation.id,
    constellationName: constellation.name,
    capabilityLabel: capabilityMeta.label,
  });

  function runLeaveAction() {
    const action = leaveActionRef.current;
    leaveActionRef.current = onBackToSettings;
    action();
  }

  function requestLeave(action: () => void = onBackToSettings) {
    leaveActionRef.current = action;
    if (closeRef.current) {
      closeRef.current();
      return;
    }
    runLeaveAction();
  }

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: () => requestLeave(onNavigateHome),
    onProject: (id) => requestLeave(() => onOpenProject(id)),
    onConstellations: (id) => requestLeave(() => onOpenConstellations(id)),
    onConstellation: (projectId, constellationId) =>
      requestLeave(() => onOpenConstellation(projectId, constellationId)),
    onConstellationSettings: (projectId, constellationId) =>
      requestLeave(() => {
        if (projectId === project.id && constellationId === constellation.id) {
          onBackToSettings();
          return;
        }
        onBackToSettings();
      }),
  };

  const manager = useMemo(() => {
    if (!allowed) return null;

    const onCancel = () => runLeaveAction();

    switch (capabilityId) {
      case "dataTable":
        return (
          <>
            <ActiveDataTablesManager
              open
              presentation="page"
              tables={bundle.tables}
              catalog={TABLE_CATALOG}
              closeRef={closeRef}
              onCommit={(tables: DataTableRecord[]) => {
                commitBundle({ ...bundle, tables });
              }}
              onCancel={onCancel}
              onPreview={setPreviewTableId}
              onEditDetails={setDetailsTableId}
              onConfigureColumns={setColumnsTableId}
            />
            <TablePreviewDrawer
              table={openPreviewTable}
              open={Boolean(openPreviewTable)}
              onOpenChange={(open) => {
                if (!open) setPreviewTableId(null);
              }}
              onEditDetails={() => {
                if (!openPreviewTable) return;
                setPreviewTableId(null);
                setDetailsTableId(openPreviewTable.id);
              }}
              onConfigureColumns={() => {
                if (!openPreviewTable) return;
                setPreviewTableId(null);
                setColumnsTableId(openPreviewTable.id);
              }}
            />
            <EditTableDetailsDialog
              table={openDetailsTable}
              open={Boolean(openDetailsTable)}
              onOpenChange={(open) => {
                if (!open) setDetailsTableId(null);
              }}
              onSave={(tableId, patch) => {
                commitBundle({
                  ...bundle,
                  tables: bundle.tables.map((table) =>
                    table.id === tableId ? { ...table, ...patch } : table,
                  ),
                });
              }}
            />
            <ConfigureColumnsDialog
              table={openColumnsTable}
              open={Boolean(openColumnsTable)}
              onOpenChange={(open) => {
                if (!open) setColumnsTableId(null);
              }}
              onSave={(tableId, columns) => {
                commitBundle({
                  ...bundle,
                  tables: bundle.tables.map((table) =>
                    table.id === tableId ? { ...table, columns } : table,
                  ),
                });
              }}
            />
          </>
        );
      case "kb":
        return (
          <KnowledgeBaseManager
            open
            presentation="page"
            entries={bundle.knowledgeBase}
            closeRef={closeRef}
            onCommit={(knowledgeBase: KnowledgeBaseEntry[]) => {
              commitBundle({ ...bundle, knowledgeBase });
            }}
            onCancel={onCancel}
          />
        );
      case "instr":
        return (
          <InstructionManager
            open
            presentation="page"
            data={bundle.instruction}
            closeRef={closeRef}
            onCommit={(instruction: InstructionData) => {
              commitBundle({ ...bundle, instruction });
            }}
            onCancel={onCancel}
          />
        );
      case "contextFiles":
        return (
          <ExtraContextFilesManager
            open
            presentation="page"
            files={bundle.contextFiles}
            closeRef={closeRef}
            onCommit={(contextFiles: ExtraContextFile[]) => {
              commitBundle({ ...bundle, contextFiles });
            }}
            onCancel={onCancel}
          />
        );
      case "relationship":
        return (
          <RelationshipManager
            open
            presentation="page"
            relationships={bundle.relationships}
            closeRef={closeRef}
            onCommit={(relationships: RelationshipRecord[]) => {
              commitBundle({ ...bundle, relationships });
            }}
            onCancel={onCancel}
          />
        );
      case "metrics":
        return (
          <MetricsManager
            open
            presentation="page"
            metrics={bundle.metrics}
            closeRef={closeRef}
            onCommit={(metrics: MetricRecord[]) => {
              commitBundle({ ...bundle, metrics });
            }}
            onCancel={onCancel}
          />
        );
      case "pdfFiles":
        return (
          <>
            {constellation.type === "csv" && bundle.csvParseConfig ? (
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                  <span className="luxia-type-caption">Delimiter:</span>{" "}
                  {bundle.csvParseConfig.delimiter || ","}
                </p>
                <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                  <span className="luxia-type-caption">Header row:</span>{" "}
                  {bundle.csvParseConfig.hasHeader
                    ? "First row contains column headers"
                    : "No header row"}
                </p>
              </div>
            ) : null}
            <PDFFilesManager
              open
              presentation="page"
              files={bundle.pdfFiles}
              fileKind={constellation.type === "csv" ? "csv" : "pdf"}
              fileTagSourceIds={connectedSourceIds}
              closeRef={closeRef}
              onCommit={(pdfFiles: PDFFileRecord[]) => {
                commitBundle({ ...bundle, pdfFiles });
              }}
              onCancel={onCancel}
            />
          </>
        );
      case "crawler":
        return (
          <CrawlerManager
            open
            presentation="page"
            state={bundle.crawler}
            closeRef={closeRef}
            onCommit={(crawler: CrawlerState) => {
              commitBundle({ ...bundle, crawler });
            }}
            onCancel={onCancel}
          />
        );
      default:
        return null;
    }
  }, [
    allowed,
    bundle,
    capabilityId,
    constellation.type,
    connectedSourceIds,
    onBackToSettings,
    onUpdateBundle,
    readOnly,
    openColumnsTable,
    openDetailsTable,
    openPreviewTable,
  ]);

  if (unavailable || !allowed) {
    return (
      <LuxiaPageFrame variant={CONSTELLATION_SETTINGS_PAGE_VARIANT}>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
          <p className="luxia-type-overline-data" style={{ color: HS.sectionHeading }}>
            Constellation Settings
          </p>
          <h1 className="luxia-type-title-page" style={{ color: "var(--luxia-purple-70)" }}>
            Unavailable
          </h1>
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            {unavailableReason
              ?? (!allowed
                ? `${capabilityMeta.label} is not available for ${constellation.type} Constellations.`
                : "This capability page is not available.")}
          </p>
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.back} onClick={onBackToSettings}>
            Back to Constellation Settings
          </Button>
        </div>
      </LuxiaPageFrame>
    );
  }

  return (
    <LuxiaPageFrame variant={CONSTELLATION_SETTINGS_PAGE_VARIANT}>
      <LuxiaPageHeadingRegion>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="Constellation Settings"
        title={capabilityMeta.label}
        titleStyle={{ color: HS.sectionHeading }}
        titleMetadata={
          readOnly ? (
            <LuxiaPageReadOnlyBadge ariaLabel="Read only. Changes cannot be saved for your Project role." />
          ) : undefined
        }
        titleLeading={
          <CapabilityIcon
            size={18}
            strokeWidth={1.75}
            aria-hidden
            style={{ color: "var(--luxia-text-secondary)" }}
          />
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        context={
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {constellationTypeLabel(constellation.type)}
            {constellation.status !== "active" && constellation.status !== "Active"
              ? ` · ${constellation.status === "archived" || constellation.status === "Archived" ? "Archived" : constellation.status}`
              : ""}
            {" · "}
            {project.name}
          </p>
        }
        guide={capabilityMeta.purpose}
        secondaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.back}
            onClick={() => requestLeave(onBackToSettings)}
          >
            Back to Constellation Settings
          </Button>
        }
      />
      </LuxiaPageHeadingRegion>

      <LuxiaPageBody>
        <div
          className={`${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-padded-sm`}
          aria-disabled={readOnly || undefined}
          style={readOnly ? { pointerEvents: "none", opacity: 0.92 } : undefined}
        >
          {manager}
        </div>
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
