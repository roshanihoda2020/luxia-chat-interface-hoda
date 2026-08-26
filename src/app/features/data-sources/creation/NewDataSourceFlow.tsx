import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  DataSourceCatalogItem,
  DataSourceConnector,
  DataSourceContentSummary,
} from "@/app/features/permissions/types";
import { getConnectorOption, isDatabaseConnector } from "./connectors";
import { CsvImportFlow } from "./CsvImportFlow";
import { DatabaseConnectionDialog } from "./DatabaseConnectionDialog";
import { FileUploadDialog } from "./FileUploadDialog";
import { NewDataSourceChooserDialog } from "./NewDataSourceChooserDialog";
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
  nextPrototypeDataSourceName,
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

function defaultOwnership(allowOrganizational: boolean): DataSourceOwnershipChoice {
  return allowOrganizational ? "organizational" : "private";
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
  const [ownership, setOwnership] = useState<DataSourceOwnershipChoice>(
    defaultOwnership(allowOrganizational),
  );
  const [dbFieldsByConnector, setDbFieldsByConnector] = useState<
    Partial<Record<DataSourceConnector, DatabaseConnectionFields>>
  >({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const createdSourceRef = useRef<DataSourceCatalogItem | null>(null);

  const suggestedName = useMemo(
    () => nextPrototypeDataSourceName(existingSources),
    [existingSources],
  );

  useEffect(() => {
    if (!open) return;
    createdSourceRef.current = null;
    setPhase("chooser");
    setConnector(null);
    setName(suggestedName);
    setOwnership(defaultOwnership(allowOrganizational));
    setDbFieldsByConnector({});
    setDiscardOpen(false);
    setSessionKey((value) => value + 1);
    // Reset only when the dialog opens. Do not reset after catalog create while the CSV Summary is still showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- suggestedName/existingSources change after create
  }, [open]);

  useEffect(() => {
    if (!allowOrganizational && ownership === "organizational") {
      setOwnership("private");
    }
  }, [allowOrganizational, ownership]);

  const dirty = useMemo(() => {
    if (connector) return true;
    if (name.trim() && name.trim() !== suggestedName.trim()) return true;
    if (ownership !== defaultOwnership(allowOrganizational)) return true;
    if (Object.keys(dbFieldsByConnector).length > 0) return true;
    return phase !== "chooser";
  }, [
    connector,
    name,
    ownership,
    allowOrganizational,
    suggestedName,
    dbFieldsByConnector,
    phase,
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
    return {
      id: nextPrototypeDataSourceId(existingSources),
      name: name.trim() || suggestedName,
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
    options?: { openSettings?: boolean },
  ) {
    onCreated(source, returnContext, options);
    onOpenChange(false);
  }

  function handleChooserNext() {
    if (!connector || !name.trim()) return;
    if (isDatabaseConnector(connector)) {
      setDbFieldsByConnector((prev) => ({
        ...prev,
        [connector]: prev[connector] ?? emptyDatabaseFields(connector),
      }));
      setPhase("database");
      return;
    }
    if (connector === "csv") {
      setPhase("csv");
      return;
    }
    setPhase("file");
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
          delimiter: table.delimiter,
          encoding: table.encoding,
          importedRows: table.importedRows,
          skippedRows: table.skippedRows,
        })),
      },
    });
    createdSourceRef.current = source;
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

  const ownershipLabel = ownership === "private" ? "Private" : "Organizational";
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
      />

      {connector && activeDbFields && isDatabaseConnector(connector) ? (
        <DatabaseConnectionDialog
          key={`db-${sessionKey}-${connector}`}
          open={open && phase === "database"}
          connector={connector}
          sourceName={name.trim() || suggestedName}
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
            );
          }}
        />
      ) : null}

      <CsvImportFlow
        key={`csv-${sessionKey}`}
        open={open && phase === "csv"}
        sourceName={name.trim() || suggestedName}
        ownershipLabel={ownershipLabel}
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
        sourceName={name.trim() || suggestedName}
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
          );
        }}
      />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this Data Source draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your connector choice and entered details will not be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
