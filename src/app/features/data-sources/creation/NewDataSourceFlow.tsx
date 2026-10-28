import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DataSourceCatalogItem,
  DataSourceConnector,
  DataSourceContentSummary,
} from "@/app/features/permissions/types";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { getConnectorOption, isDatabaseConnector, isSheetLinkConnector } from "./connectors";
import { CsvImportFlow } from "./CsvImportFlow";
import { DatabaseConnectionDialog } from "./DatabaseConnectionDialog";
import { FileUploadDialog } from "./FileUploadDialog";
import { GoogleSheetImportDialog } from "./GoogleSheetImportDialog";
import {
  buildGoogleSheetContentSummary,
  delayGoogleSheetMockImport,
  shouldFailGoogleSheetPrototype,
} from "./googleSheetImport";
import { NewDataSourceChooserDialog } from "./NewDataSourceChooserDialog";
import { useDraftDataSourceTags } from "@/app/features/document-tags";
import type {
  CreationPhase,
  CsvImportCompletePayload,
  DatabaseConnectionFields,
  DataSourceCreationReturnContext,
  DataSourceOwnershipChoice,
} from "./types";
import {
  emptyDatabaseFields,
  nextPrototypeDataSourceId,
} from "./types";
import type { DataSourceHandoffProject } from "../constellationHandoff";

export interface NewDataSourceFlowProps {
  open: boolean;
  currentUserId: string;
  allowOrganizational: boolean;
  existingSources: DataSourceCatalogItem[];
  returnContext?: DataSourceCreationReturnContext;
  onOpenChange: (open: boolean) => void;
  onCreated: (
    source: DataSourceCatalogItem,
    returnContext: DataSourceCreationReturnContext,
    options?: { openSettings?: boolean },
  ) => void;
  eligibleProjects?: DataSourceHandoffProject[];
  onCreateConstellationFromSource?: (sourceId: string, projectId?: string) => void;
}

export function NewDataSourceFlow({
  open,
  currentUserId,
  allowOrganizational,
  existingSources,
  returnContext = { kind: "library" },
  onOpenChange,
  onCreated,
  eligibleProjects = [],
  onCreateConstellationFromSource,
}: NewDataSourceFlowProps) {
  const [phase, setPhase] = useState<CreationPhase>("chooser");
  const [connector, setConnector] = useState<DataSourceConnector | null>(null);
  const [name, setName] = useState("");
  const [ownership, setOwnership] = useState<DataSourceOwnershipChoice | null>(null);
  const [dbFieldsByConnector, setDbFieldsByConnector] = useState<
    Partial<Record<DataSourceConnector, DatabaseConnectionFields>>
  >({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [sheetImporting, setSheetImporting] = useState(false);
  const createdSourceRef = useRef<DataSourceCatalogItem | null>(null);
  const sheetImportTokenRef = useRef(0);
  const tagDraft = useDraftDataSourceTags();

  useEffect(() => {
    if (!open) return;
    createdSourceRef.current = null;
    setPhase("chooser");
    setConnector(null);
    setName("");
    setOwnership(null);
    setDbFieldsByConnector({});
    setDiscardOpen(false);
    setSheetImporting(false);
    sheetImportTokenRef.current += 1;
    setSessionKey((value) => value + 1);
    tagDraft.reset();
    // Reset only when the dialog opens. Do not reset after catalog create while the CSV Summary is still showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalog changes must not clear an open flow
  }, [open]);

  useEffect(() => {
    if (!allowOrganizational && ownership === "organizational") {
      setOwnership(null);
    }
  }, [allowOrganizational, ownership]);

  const dirty = useMemo(() => {
    if (connector) return true;
    if (name.trim()) return true;
    if (ownership) return true;
    if (Object.keys(dbFieldsByConnector).length > 0) return true;
    if (!tagDraft.isEmpty) return true;
    return phase !== "chooser";
  }, [
    connector,
    name,
    ownership,
    dbFieldsByConnector,
    phase,
    tagDraft.isEmpty,
  ]);

  function requestClose() {
    if (createdSourceRef.current) {
      onOpenChange(false);
      return;
    }
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function confirmDiscard() {
    setDiscardOpen(false);
    onOpenChange(false);
  }

  function buildSource(partial: {
    connector: DataSourceConnector;
    type: DataSourceCatalogItem["type"];
    status: DataSourceCatalogItem["status"];
    contentSummary?: DataSourceContentSummary;
  }): DataSourceCatalogItem {
    const trimmedName = name.trim();
    if (!ownership || !trimmedName) {
      throw new Error("Data Source name and ownership are required.");
    }
    return {
      id: nextPrototypeDataSourceId(existingSources),
      name: trimmedName,
      type: partial.type,
      connector: partial.connector,
      ownership,
      ownerUserId: ownership === "private" ? currentUserId : "",
      status: partial.status,
      contentSummary: partial.contentSummary,
    };
  }

  function databaseContentSummary(
    fields: DatabaseConnectionFields,
    connectorId: DataSourceConnector,
  ): DataSourceContentSummary {
    if (connectorId === "bigquery") {
      return {
        kind: "database",
        projectId: fields.projectId.trim() || undefined,
        dataset: fields.dataset.trim() || undefined,
        username: fields.username.trim() || undefined,
      };
    }
    if (connectorId === "snowflake") {
      return {
        kind: "database",
        account: fields.account.trim() || undefined,
        username: fields.username.trim() || undefined,
        warehouse: fields.warehouse.trim() || undefined,
        database: fields.database.trim() || undefined,
        role: fields.role.trim() || undefined,
      };
    }
    return {
      kind: "database",
      host: fields.host.trim() || undefined,
      port: fields.port.trim() || undefined,
      database: fields.database.trim() || undefined,
      username: fields.username.trim() || undefined,
      ssl: fields.ssl,
    };
  }

  function finish(
    source: DataSourceCatalogItem,
    options?: {
      openSettings?: boolean;
      retainFileNames?: readonly string[];
      retainTableIds?: readonly string[];
    },
  ) {
    tagDraft.commitTo(source.id, {
      retainFileNames: options?.retainFileNames,
      retainTableIds: options?.retainTableIds,
    });
    onCreated(
      source,
      returnContext,
      options?.openSettings ? { openSettings: true } : undefined,
    );
    onOpenChange(false);
  }

  function handleChooserNext() {
    if (!connector || !name.trim() || !ownership) return;
    if (isDatabaseConnector(connector)) {
      setDbFieldsByConnector((prev) => ({
        ...prev,
        [connector]: prev[connector] ?? emptyDatabaseFields(connector),
      }));
      setPhase("database");
      return;
    }
    if (isSheetLinkConnector(connector)) {
      setPhase("googlesheet");
      return;
    }
    if (connector === "csv") {
      setPhase("csv");
      return;
    }
    setPhase("file");
  }

  async function handleGoogleSheetImport(link: string) {
    if (sheetImporting) return;
    const token = ++sheetImportTokenRef.current;
    setSheetImporting(true);
    await delayGoogleSheetMockImport();
    if (token !== sheetImportTokenRef.current) return;

    if (shouldFailGoogleSheetPrototype(link)) {
      setSheetImporting(false);
      luxiaToast.error({
        title: "Could not import this sheet",
        description:
          "Connection failed. Check the connection details and network access.",
      });
      return;
    }

    const contentSummary = buildGoogleSheetContentSummary(link);
    const tableIds = (contentSummary.csvTables ?? []).map((table) => table.id);
    setSheetImporting(false);
    finish(
      buildSource({
        connector: "googlesheet",
        type: "CSV",
        status: "active",
        contentSummary,
      }),
      { openSettings: true, retainFileNames: [], retainTableIds: tableIds },
    );
  }

  function finishCsv(payload: CsvImportCompletePayload) {
    const tables = payload.tables;
    const first = tables[0];
    const importedRows = tables.reduce((sum, table) => sum + table.importedRows, 0);
    const skippedRows = tables.reduce((sum, table) => sum + table.skippedRows, 0);
    const source = buildSource({
      connector: "csv",
      type: "CSV",
      status: "active",
      contentSummary: {
        kind: "csv",
        fileName: first?.fileName,
        tableName: first?.tableName,
        tableDescription: first?.tableDescription || undefined,
        delimiter: first?.delimiter,
        encoding: first?.encoding,
        importedRows,
        skippedRows,
        csvTables: tables.map((table) => ({
          id: table.id,
          fileName: table.fileName,
          tableName: table.tableName,
          tableDescription: table.tableDescription || undefined,
          tableDescriptionOrigin: table.tableDescription ? table.tableDescriptionOrigin : undefined,
          delimiter: table.delimiter,
          encoding: table.encoding,
          importedRows: table.importedRows,
          skippedRows: table.skippedRows,
          valueContext: table.valueContext,
          columns: table.columns,
          columnDescriptions: table.columnDescriptions,
        })),
      },
    });
    createdSourceRef.current = source;
    tagDraft.commitTo(source.id, {
      retainFileNames: [],
      retainTableIds: tables.map((table) => table.id),
    });
    onCreated(source, returnContext);
  }

  function finishAfterCsvCreate(options?: { openSettings?: boolean }) {
    const source = createdSourceRef.current;
    if (options?.openSettings && source) {
      onCreated(source, returnContext, { openSettings: true });
    }
    onOpenChange(false);
  }

  function finishCsvWithCreate(projectId: string) {
    const source = createdSourceRef.current;
    onOpenChange(false);
    if (!source) return;
    onCreateConstellationFromSource?.(source.id, projectId);
  }

  const ownershipLabel =
    ownership === "private" ? "Private" : ownership === "organizational" ? "Organizational" : "";
  const activeDbFields =
    connector && isDatabaseConnector(connector)
      ? dbFieldsByConnector[connector] ?? emptyDatabaseFields(connector)
      : null;

  return (
    <>
      <NewDataSourceChooserDialog
        open={open && phase === "chooser"}
        connector={connector}
        name={name}
        ownership={ownership}
        allowOrganizational={allowOrganizational}
        onConnectorChange={setConnector}
        onNameChange={setName}
        onOwnershipChange={setOwnership}
        onCancel={requestClose}
        onNext={handleChooserNext}
        tagDraft={tagDraft}
      />

      {connector && activeDbFields && isDatabaseConnector(connector) ? (
        <DatabaseConnectionDialog
          key={`db-${sessionKey}-${connector}`}
          open={open && phase === "database"}
          connector={connector}
          sourceName={name.trim()}
          ownershipLabel={ownershipLabel}
          fields={activeDbFields}
          onFieldsChange={(fields) =>
            setDbFieldsByConnector((prev) => ({ ...prev, [connector]: fields }))
          }
          onBack={() => setPhase("chooser")}
          onCancel={requestClose}
          onConnect={() => {
            finish(
              buildSource({
                connector,
                type: getConnectorOption(connector)?.catalogType ?? "Database",
                status: "active",
                contentSummary: databaseContentSummary(activeDbFields, connector),
              }),
              { retainFileNames: [], retainTableIds: [] },
            );
          }}
          tagDraft={tagDraft}
        />
      ) : null}

      <CsvImportFlow
        key={`csv-${sessionKey}`}
        open={open && phase === "csv"}
        sourceName={name.trim()}
        sourceNameDraft={name}
        onSourceNameChange={setName}
        ownershipLabel={ownershipLabel}
        tagDraft={tagDraft}
        onBackToChooser={() => setPhase("chooser")}
        onCancel={requestClose}
        onComplete={finishCsv}
        onFinish={finishAfterCsvCreate}
        eligibleProjects={eligibleProjects}
        onCreateConstellation={
          onCreateConstellationFromSource
            ? (projectId) => finishCsvWithCreate(projectId)
            : undefined
        }
      />

      <FileUploadDialog
        key={`file-${sessionKey}`}
        open={open && phase === "file"}
        sourceName={name.trim()}
        ownershipLabel={ownershipLabel}
        onBack={() => setPhase("chooser")}
        onCancel={requestClose}
        onCreate={(files) => {
          finish(
            buildSource({
              connector: "file",
              type: "File",
              status: "active",
              contentSummary: {
                kind: "file",
                fileNames: files.map((file) => file.name),
              },
            }),
            { retainFileNames: files.map((file) => file.name), retainTableIds: [] },
          );
        }}
        tagDraft={tagDraft}
      />

      <GoogleSheetImportDialog
        key={`sheet-${sessionKey}`}
        open={open && phase === "googlesheet"}
        sourceName={name.trim()}
        ownershipLabel={ownershipLabel}
        importing={sheetImporting}
        onBack={() => {
          if (sheetImporting) return;
          setPhase("chooser");
        }}
        onCancel={requestClose}
        onImport={(link) => {
          void handleGoogleSheetImport(link);
        }}
      />

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        chrome="compact"
        tone="destructive"
        title="Discard this Data Source draft?"
        description="Your connector choice and entered details will not be saved."
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        onConfirm={confirmDiscard}
      />
    </>
  );
}
