import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { DataSourceConnector } from "@/app/features/permissions/types";
import { getConnectorOption } from "./connectors";
import { DataSourceCreationSection, DataSourceDetailsSection, DataSourceDetailsSummary } from "./DataSourceDetailsSection";
import type {
  DatabaseConnectionFields,
  SchemaDiscoverySummary,
} from "./types";
import type { DraftDataSourceTagsApi } from "@/app/features/document-tags";

type FieldErrors = Partial<Record<keyof DatabaseConnectionFields, string>>;
type TestState = "idle" | "testing" | "success" | "auth-failed" | "failed";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 luxia-type-caption text-[var(--luxia-status-danger,var(--luxia-text-danger,#b42318))]" role="alert">
      {message}
    </p>
  );
}

function validateFields(
  connector: DataSourceConnector,
  fields: DatabaseConnectionFields,
): FieldErrors {
  const errors: FieldErrors = {};

  if (connector === "bigquery") {
    if (!fields.projectId.trim()) errors.projectId = "Project ID is required.";
    if (!fields.dataset.trim()) errors.dataset = "Dataset is required.";
    if (!fields.username.trim()) errors.username = "Service account email is required.";
    if (!fields.password.trim()) errors.password = "Credentials JSON key reference is required.";
    return errors;
  }

  if (connector === "snowflake") {
    if (!fields.account.trim()) errors.account = "Account is required.";
    if (!fields.username.trim()) errors.username = "Username is required.";
    if (fields.authMethod === "key-pair") {
      if (!fields.privateKey.trim()) errors.privateKey = "Private key is required for key-pair auth.";
    } else if (!fields.password.trim()) {
      errors.password = "Password is required.";
    }
    if (!fields.warehouse.trim()) errors.warehouse = "Warehouse is required.";
    if (!fields.database.trim()) errors.database = "Database is required.";
    return errors;
  }

  if (!fields.host.trim()) errors.host = "Host is required.";
  if (!fields.port.trim()) {
    errors.port = "Port is required.";
  } else if (!/^\d+$/.test(fields.port.trim()) || Number(fields.port) < 1 || Number(fields.port) > 65535) {
    errors.port = "Enter a valid port between 1 and 65535.";
  }
  if (!fields.username.trim()) errors.username = "Username is required.";
  if (!fields.password.trim()) errors.password = "Password is required.";
  if (!fields.database.trim()) errors.database = "Database is required.";
  return errors;
}

function simulateTest(
  fields: DatabaseConnectionFields,
): Exclude<TestState, "idle" | "testing"> {
  const user = fields.username.trim().toLowerCase();
  const host = fields.host.trim().toLowerCase();
  if (user === "bad" || fields.password === "bad") return "auth-failed";
  if (host.includes("fail") || host === "0.0.0.0") return "failed";
  return "success";
}

export interface DatabaseConnectionDialogProps {
  open: boolean;
  connector: DataSourceConnector;
  sourceName: string;
  ownershipLabel?: string;
  fields: DatabaseConnectionFields;
  onFieldsChange: (fields: DatabaseConnectionFields) => void;
  onBack: () => void;
  onCancel: () => void;
  onConnect: (schema: SchemaDiscoverySummary) => void;
  tagDraft: DraftDataSourceTagsApi;
}

export function DatabaseConnectionDialog({
  open,
  connector,
  sourceName,
  ownershipLabel,
  fields,
  onFieldsChange,
  onBack,
  onCancel,
  onConnect,
  tagDraft,
}: DatabaseConnectionDialogProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [testState, setTestState] = useState<TestState>("idle");
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaDiscoverySummary | null>(null);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);

  const option = getConnectorOption(connector);
  const requiredValid = useMemo(
    () => Object.keys(validateFields(connector, fields)).length === 0,
    [connector, fields],
  );

  function patch(partial: Partial<DatabaseConnectionFields>) {
    setTestState("idle");
    setConnectionMessage(null);
    setSchema(null);
    setShowSchemaPreview(false);
    onFieldsChange({ ...fields, ...partial });
  }

  function handleTest() {
    const nextErrors = validateFields(connector, fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setTestState("idle");
      setConnectionMessage("Complete the required fields before testing.");
      return;
    }

    setTestState("testing");
    setConnectionMessage(null);
    window.setTimeout(() => {
      const result = simulateTest(fields);
      setTestState(result);
      if (result === "success") {
        const discovered = { schemaCount: 12, tableCount: 48 };
        setSchema(discovered);
        setConnectionMessage("Connection successful.");
      } else if (result === "auth-failed") {
        setSchema(null);
        setConnectionMessage("Authentication failed. Check username and password.");
      } else {
        setSchema(null);
        setConnectionMessage("Connection failed. Check host, port, and network access.");
      }
    }, 450);
  }

  function handleConnect() {
    if (testState !== "success" || !schema) return;
    onConnect(schema);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="flex max-h-[min(92vh,44rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Connect database</DialogTitle>
          <DialogDescription>
            {option?.label ?? "Database"} · {sourceName}
            {ownershipLabel ? ` · ${ownershipLabel}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <DataSourceDetailsSection tagDraft={tagDraft}>
            <DataSourceDetailsSummary name={sourceName} ownershipLabel={ownershipLabel ?? "—"} />
          </DataSourceDetailsSection>

          <DataSourceCreationSection title="Connection">
            <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
              Enter connection settings for this connector. Passwords are masked and are not shown after creation.
            </p>

          {connector === "snowflake" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ds-db-auth">Authentication method</Label>
                <Select
                  value={fields.authMethod}
                  onValueChange={(value) =>
                    patch({ authMethod: value as DatabaseConnectionFields["authMethod"] })
                  }
                >
                  <SelectTrigger id="ds-db-auth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Username and password</SelectItem>
                    <SelectItem value="key-pair">Key pair (prototype)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-db-account">Account</Label>
                <Input
                  id="ds-db-account"
                  value={fields.account}
                  onChange={(e) => patch({ account: e.target.value })}
                  autoComplete="off"
                />
                <FieldError message={errors.account} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds-db-username">Username</Label>
                  <Input
                    id="ds-db-username"
                    value={fields.username}
                    onChange={(e) => patch({ username: e.target.value })}
                    autoComplete="username"
                  />
                  <FieldError message={errors.username} />
                </div>
                {fields.authMethod === "password" ? (
                  <div className="space-y-2">
                    <Label htmlFor="ds-db-password">Password</Label>
                    <Input
                      id="ds-db-password"
                      type="password"
                      value={fields.password}
                      onChange={(e) => patch({ password: e.target.value })}
                      autoComplete="current-password"
                    />
                    <FieldError message={errors.password} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="ds-db-passphrase">Key passphrase (optional)</Label>
                    <Input
                      id="ds-db-passphrase"
                      type="password"
                      value={fields.passphrase}
                      onChange={(e) => patch({ passphrase: e.target.value })}
                      autoComplete="off"
                    />
                  </div>
                )}
              </div>
              {fields.authMethod === "key-pair" ? (
                <div className="space-y-2">
                  <Label htmlFor="ds-db-private-key">Private key</Label>
                  <Input
                    id="ds-db-private-key"
                    type="password"
                    value={fields.privateKey}
                    onChange={(e) => patch({ privateKey: e.target.value })}
                    autoComplete="off"
                    placeholder="Paste key material (masked, not stored)"
                  />
                  <FieldError message={errors.privateKey} />
                  <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
                    Key-pair auth is simulated in this prototype. Secrets are not persisted.
                  </p>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds-db-role">Role</Label>
                  <Input
                    id="ds-db-role"
                    value={fields.role}
                    onChange={(e) => patch({ role: e.target.value })}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-db-warehouse">Warehouse</Label>
                  <Input
                    id="ds-db-warehouse"
                    value={fields.warehouse}
                    onChange={(e) => patch({ warehouse: e.target.value })}
                    autoComplete="off"
                  />
                  <FieldError message={errors.warehouse} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-db-database">Database</Label>
                <Input
                  id="ds-db-database"
                  value={fields.database}
                  onChange={(e) => patch({ database: e.target.value })}
                  autoComplete="off"
                />
                <FieldError message={errors.database} />
              </div>
            </>
          ) : connector === "bigquery" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ds-db-project">Project ID</Label>
                <Input
                  id="ds-db-project"
                  value={fields.projectId}
                  onChange={(e) => patch({ projectId: e.target.value })}
                  autoComplete="off"
                />
                <FieldError message={errors.projectId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-db-dataset">Dataset</Label>
                <Input
                  id="ds-db-dataset"
                  value={fields.dataset}
                  onChange={(e) => patch({ dataset: e.target.value })}
                  autoComplete="off"
                />
                <FieldError message={errors.dataset} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-db-username">Service account email</Label>
                <Input
                  id="ds-db-username"
                  value={fields.username}
                  onChange={(e) => patch({ username: e.target.value })}
                  autoComplete="off"
                />
                <FieldError message={errors.username} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-db-password">Credentials (JSON key)</Label>
                <Input
                  id="ds-db-password"
                  type="password"
                  value={fields.password}
                  onChange={(e) => patch({ password: e.target.value })}
                  autoComplete="off"
                  placeholder="Paste key reference (masked)"
                />
                <FieldError message={errors.password} />
                <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
                  Credentials are masked and are not shown after creation.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                <div className="space-y-2">
                  <Label htmlFor="ds-db-host">Host</Label>
                  <Input
                    id="ds-db-host"
                    value={fields.host}
                    onChange={(e) => patch({ host: e.target.value })}
                    autoComplete="off"
                    placeholder="db.example.internal"
                  />
                  <FieldError message={errors.host} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-db-port">Port</Label>
                  <Input
                    id="ds-db-port"
                    value={fields.port}
                    onChange={(e) => patch({ port: e.target.value })}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                  <FieldError message={errors.port} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ds-db-username">Username</Label>
                  <Input
                    id="ds-db-username"
                    value={fields.username}
                    onChange={(e) => patch({ username: e.target.value })}
                    autoComplete="username"
                  />
                  <FieldError message={errors.username} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-db-password">Password</Label>
                  <Input
                    id="ds-db-password"
                    type="password"
                    value={fields.password}
                    onChange={(e) => patch({ password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <FieldError message={errors.password} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-db-database">Database</Label>
                <Input
                  id="ds-db-database"
                  value={fields.database}
                  onChange={(e) => patch({ database: e.target.value })}
                  autoComplete="off"
                />
                <FieldError message={errors.database} />
              </div>
              {(connector === "postgres" || connector === "mysql" || connector === "mssql" || connector === "redshift") ? (
                <label className="flex items-center gap-2 luxia-type-body-dense text-[var(--luxia-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={fields.ssl}
                    onChange={(e) => patch({ ssl: e.target.checked })}
                    className="size-4 rounded border-[var(--luxia-border-subtle)]"
                  />
                  Require SSL
                </label>
              ) : null}
            </>
          )}

          {connectionMessage ? (
            <div
              className="rounded-[var(--luxia-radius-control)] border px-3 py-2.5"
              style={{
                borderColor: "var(--luxia-border-subtle)",
                background: "var(--luxia-surface-muted)",
              }}
              role="status"
            >
              <p
                className="luxia-type-body-dense"
                style={{
                  color:
                    testState === "success"
                      ? "var(--luxia-text-primary)"
                      : "var(--luxia-status-danger,var(--luxia-text-danger,#b42318))",
                }}
              >
                {connectionMessage}
              </p>
              {testState === "success" && schema ? (
                <div className="mt-2 space-y-2">
                  <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                    {schema.schemaCount} schemas · {schema.tableCount} tables discovered
                  </p>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="compact"
                    onClick={() => setShowSchemaPreview((v) => !v)}
                  >
                    {showSchemaPreview ? "Hide schema preview" : "Preview schema"}
                  </Button>
                  {showSchemaPreview ? (
                    <ul className="max-h-28 overflow-y-auto luxia-type-caption text-[var(--luxia-text-secondary)]">
                      <li>public · orders</li>
                      <li>public · customers</li>
                      <li>public · products</li>
                      <li>analytics · events</li>
                      <li>… read-only discovery preview</li>
                    </ul>
                  ) : null}
                  <p className="luxia-type-caption text-[var(--luxia-text-muted)]">
                    Constellation Active Data Tables are configured later when connecting a Constellation.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          </DataSourceCreationSection>
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="secondary" size="compact" onClick={onBack}>
            Back
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="compact"
              disabled={!requiredValid || testState === "testing"}
              onClick={handleTest}
            >
              {testState === "testing" ? "Testing…" : "Test database"}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="compact"
              disabled={testState !== "success"}
              onClick={handleConnect}
            >
              Link Data Source
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
