import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
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
import { DataViewsManager } from "@/app/features/data-views";
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
import type { UnsavedNavigationGuard } from "@/app/features/shared/unsavedNavigationGuard";
import {
  normalizeCapabilityBundle,
  type ConstellationCapabilityBundle,
} from "./capabilityState";
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
  /** App-level leave guard (sidebar / browser history). */
  navigationGuardRef?: MutableRefObject<UnsavedNavigationGuard | null>;
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
  navigationGuardRef,
}: ConstellationCapabilityManagePageProps) {
  const capabilityMeta = capabilityMetaForType(capabilityId, constellation.type);
  const CapabilityIcon = capabilityMeta.icon;
  const allowed = isCapsuleCapabilityAllowed(capabilityId, constellation.type);
  const closeRef = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(false);
  const leaveActionRef = useRef(onBackToSettings);
  leaveActionRef.current = onBackToSettings;
  const safeBundle = normalizeCapabilityBundle(bundle);

  const commitBundle = (next: ConstellationCapabilityBundle) => {
    if (readOnly) return;
    onUpdateBundle(normalizeCapabilityBundle(next));
  };

  const [previewTableId, setPreviewTableId] = useState<string | null>(null);
  const [detailsTableId, setDetailsTableId] = useState<string | null>(null);
  const [columnsTableId, setColumnsTableId] = useState<string | null>(null);
  const [previewViewId, setPreviewViewId] = useState<string | null>(null);
  const [detailsViewId, setDetailsViewId] = useState<string | null>(null);
  const [columnsViewId, setColumnsViewId] = useState<string | null>(null);

  const openPreviewTable = safeBundle.tables.find((table) => table.id === previewTableId) ?? null;
  const openDetailsTable = safeBundle.tables.find((table) => table.id === detailsTableId) ?? null;
  const openColumnsTable = safeBundle.tables.find((table) => table.id === columnsTableId) ?? null;
  const openPreviewView = safeBundle.views.find((view) => view.id === previewViewId) ?? null;
  const openDetailsView = safeBundle.views.find((view) => view.id === detailsViewId) ?? null;
  const openColumnsView = safeBundle.views.find((view) => view.id === columnsViewId) ?? null;

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

  useEffect(() => {
    if (!navigationGuardRef) return;
    navigationGuardRef.current = {
      isDirty: () => dirtyRef.current,
      requestLeaveConfirmation: (onConfirmed) => {
        requestLeave(onConfirmed);
      },
    };
    return () => {
      navigationGuardRef.current = null;
    };
  }, [navigationGuardRef]);

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
              tables={safeBundle.tables}
              catalog={TABLE_CATALOG}
              closeRef={closeRef}
              dirtyRef={dirtyRef}
              readOnly={readOnly}
              onCommit={(tables: DataTableRecord[]) => {
                commitBundle({ ...safeBundle, tables });
              }}
              onCancel={onCancel}
              onPreview={setPreviewTableId}
              onEditDetails={setDetailsTableId}
              onConfigureColumns={setColumnsTableId}
            />
            <TablePreviewDrawer
              table={openPreviewTable}
              open={Boolean(openPreviewTable)}
              hideMutatingActions={readOnly}
              onOpenChange={(open) => {
                if (!open) setPreviewTableId(null);
              }}
              onEditDetails={() => {
                if (!openPreviewTable || readOnly) return;
                setPreviewTableId(null);
                setDetailsTableId(openPreviewTable.id);
              }}
              onConfigureColumns={() => {
                if (!openPreviewTable || readOnly) return;
                setPreviewTableId(null);
                setColumnsTableId(openPreviewTable.id);
              }}
            />
            {!readOnly ? (
              <EditTableDetailsDialog
                table={openDetailsTable}
                open={Boolean(openDetailsTable)}
                onOpenChange={(open) => {
                  if (!open) setDetailsTableId(null);
                }}
                onSave={(tableId, patch) => {
                  commitBundle({
                    ...safeBundle,
                    tables: safeBundle.tables.map((table) =>
                      table.id === tableId ? { ...table, ...patch } : table,
                    ),
                  });
                }}
              />
            ) : null}
            {!readOnly ? (
              <ConfigureColumnsDialog
                table={openColumnsTable}
                open={Boolean(openColumnsTable)}
                onOpenChange={(open) => {
                  if (!open) setColumnsTableId(null);
                }}
                onSave={(tableId, columns) => {
                  commitBundle({
                    ...safeBundle,
                    tables: safeBundle.tables.map((table) =>
                      table.id === tableId ? { ...table, columns } : table,
                    ),
                  });
                }}
                constellationId={constellation.id}
              />
            ) : null}
          </>
        );
      case "views":
        return (
          <>
            <DataViewsManager
              presentation="page"
              views={safeBundle.views}
              readOnly={readOnly}
              closeRef={closeRef}
              dirtyRef={dirtyRef}
              onCancel={onCancel}
              onCommit={(nextViews: DataTableRecord[]) => {
                commitBundle({ ...safeBundle, views: nextViews });
              }}
              onPreview={setPreviewViewId}
              onEditDetails={setDetailsViewId}
              onConfigureColumns={setColumnsViewId}
            />
            <TablePreviewDrawer
              entityKind="view"
              hideMutatingActions={readOnly}
              table={openPreviewView}
              open={Boolean(openPreviewView)}
              onOpenChange={(open) => {
                if (!open) setPreviewViewId(null);
              }}
              onEditDetails={() => {
                if (!openPreviewView || readOnly) return;
                setPreviewViewId(null);
                setDetailsViewId(openPreviewView.id);
              }}
              onConfigureColumns={() => {
                if (!openPreviewView || readOnly) return;
                setPreviewViewId(null);
                setColumnsViewId(openPreviewView.id);
              }}
            />
            <EditTableDetailsDialog
              entityKind="view"
              table={openDetailsView}
              open={Boolean(openDetailsView)}
              onOpenChange={(open) => {
                if (!open) setDetailsViewId(null);
              }}
              onSave={(viewId, patch) => {
                commitBundle({
                  ...safeBundle,
                  views: safeBundle.views.map((view) =>
                    view.id === viewId ? { ...view, ...patch } : view,
                  ),
                });
              }}
            />
            <ConfigureColumnsDialog
              entityKind="view"
              table={openColumnsView}
              open={Boolean(openColumnsView)}
              onOpenChange={(open) => {
                if (!open) setColumnsViewId(null);
              }}
              onSave={(viewId, columns) => {
                commitBundle({
                  ...safeBundle,
                  views: safeBundle.views.map((view) =>
                    view.id === viewId ? { ...view, columns } : view,
                  ),
                });
              }}
              constellationId={constellation.id}
            />
          </>
        );
      case "kb":
        return (
          <KnowledgeBaseManager
            open
            presentation="page"
            entries={safeBundle.knowledgeBase}
            closeRef={closeRef}
            dirtyRef={dirtyRef}
            readOnly={readOnly}
            onCommit={(knowledgeBase: KnowledgeBaseEntry[]) => {
              commitBundle({ ...safeBundle, knowledgeBase });
            }}
            onCancel={onCancel}
          />
        );
      case "instr":
        return (
          <InstructionManager
            open
            presentation="page"
            data={safeBundle.instruction}
            closeRef={closeRef}
            dirtyRef={dirtyRef}
            readOnly={readOnly}
            onCommit={(instruction: InstructionData) => {
              commitBundle({ ...safeBundle, instruction });
            }}
            onCancel={onCancel}
          />
        );
      case "contextFiles":
        return (
          <ExtraContextFilesManager
            open
            presentation="page"
            files={safeBundle.contextFiles}
            closeRef={closeRef}
            dirtyRef={dirtyRef}
            onCommit={(contextFiles: ExtraContextFile[]) => {
              commitBundle({ ...safeBundle, contextFiles });
            }}
            onCancel={onCancel}
          />
        );
      case "relationship":
        return (
          <RelationshipManager
            open
            presentation="page"
            relationships={safeBundle.relationships}
            closeRef={closeRef}
            dirtyRef={dirtyRef}
            onCommit={(relationships: RelationshipRecord[]) => {
              commitBundle({ ...safeBundle, relationships });
            }}
            onCancel={onCancel}
          />
        );
      case "metrics":
        return (
          <MetricsManager
            open
            presentation="page"
            metrics={safeBundle.metrics}
            closeRef={closeRef}
            dirtyRef={dirtyRef}
            onCommit={(metrics: MetricRecord[]) => {
              commitBundle({ ...safeBundle, metrics });
            }}
            onCancel={onCancel}
          />
        );
      case "pdfFiles":
        return (
          <>
            {constellation.type === "csv" && safeBundle.csvParseConfig ? (
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                  <span className="luxia-type-caption">Delimiter:</span>{" "}
                  {safeBundle.csvParseConfig.delimiter || ","}
                </p>
                <p className="luxia-type-body-dense text-[var(--luxia-text-primary)]">
                  <span className="luxia-type-caption">Header row:</span>{" "}
                  {safeBundle.csvParseConfig.hasHeader
                    ? "First row contains column headers"
                    : "No header row"}
                </p>
              </div>
            ) : null}
            <PDFFilesManager
              open
              presentation="page"
              files={safeBundle.pdfFiles}
              fileKind={constellation.type === "csv" ? "csv" : "pdf"}
              fileTagSourceIds={connectedSourceIds}
              closeRef={closeRef}
              dirtyRef={dirtyRef}
              onCommit={(pdfFiles: PDFFileRecord[]) => {
                commitBundle({ ...safeBundle, pdfFiles });
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
            state={safeBundle.crawler}
            closeRef={closeRef}
            dirtyRef={dirtyRef}
            onCommit={(crawler: CrawlerState) => {
              commitBundle({ ...safeBundle, crawler });
            }}
            onCancel={onCancel}
          />
        );
      default:
        return null;
    }
  }, [
    allowed,
    safeBundle,
    capabilityId,
    constellation.type,
    connectedSourceIds,
    onBackToSettings,
    onUpdateBundle,
    readOnly,
    openColumnsTable,
    openDetailsTable,
    openPreviewTable,
    openColumnsView,
    openDetailsView,
    openPreviewView,
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
        {(() => {
          // Prefer native manager readOnly over a faded/blocked shell.
          // Remaining managers still block pointer input when read-only so
          // restricted actions stay unreachable, without fading the surface.
          const hasNativeReadOnly =
            capabilityId === "kb"
            || capabilityId === "views"
            || capabilityId === "instr"
            || capabilityId === "dataTable";
          const lockInteractive = readOnly && !hasNativeReadOnly;
          return (
            <div
              className={`${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-padded-sm`}
              aria-disabled={lockInteractive || undefined}
              style={lockInteractive ? { pointerEvents: "none" } : undefined}
            >
              {manager}
            </div>
          );
        })()}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
