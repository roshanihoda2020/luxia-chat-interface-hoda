import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { CircleAlert, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
  LuxiaPageHeadingRegion,
} from "@/app/components/LuxiaPageFrame";
import {
  LuxiaPageGuide,
  LuxiaPageHeader,
  LuxiaPageEntityUpdatedMeta,
} from "@/app/components/LuxiaPageHeader";
import { LuxiaPageReadOnlyBadge } from "@/app/components/LuxiaPageReadOnlyBadge";
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
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import {
  LuxiaArrowRightIcon,
  LuxiaConstellationIcon,
  LuxiaDatasourceIcon,
  LuxiaProjectsIcon,
} from "@/assets/icons";
import {
  LUXIA_CREATE_VS_EDIT,
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_LIST_SURFACE_CLASS,
  LUXIA_SETTINGS_TAB_PANEL_CLASS,
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import { toast } from "sonner";
import {
  BrowserFilterSelect,
  FilterField,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  DATA_SOURCE_CATALOG,
  buildAccessLevelImpactPreview,
  formatDataSourceType,
  getOrganizationUserById,
  getOrganizationUsers,
  isDataSourceUsable,
} from "./data";
import {
  getDataSourceOwnerDisplay,
  ORGANIZATIONAL_MANAGED_LABEL,
} from "./ownershipDisplay";
import {
  ACCESS_LEVEL_EDITOR_SECTIONS,
  ACCESS_LEVELS_GUIDANCE,
  type AccessLevelEditorSectionId,
} from "./ia";
import { LuxiaAccessGuide } from "./LuxiaAccessGuide";
import type {
  AccessLevelPermission,
  AccessLevelRecord,
  AccessLevelSourceGrant,
  DataSourceCatalogItem,
  OrganizationUser,
} from "./types";

const PARENT_SURFACE_CLASS = LUXIA_SETTINGS_CONTENT_SURFACE_CLASS;

const SETTINGS_FORM_COLUMN_CLASS = "w-full max-w-[45rem]";

const SETTINGS_TAB_PANEL_CLASS = LUXIA_SETTINGS_TAB_PANEL_CLASS;

function formatAccessLevelUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function recordsEqual(a: AccessLevelRecord, b: AccessLevelRecord): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sourceStatusLabel(status: string): string {
  if (status === "active") return "Active";
  if (status === "archived") return "Archived";
  return "Inactive";
}

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function ImpactSectionHeader({
  title,
  countLabel,
}: {
  title: string;
  countLabel: string;
}) {
  return (
    <div className="mb-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3
        className="luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="luxia-type-caption tabular-nums"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {countLabel}
      </p>
    </div>
  );
}

function ImpactEntityRow({
  icon,
  title,
  secondary,
  trailing,
  onOpen,
  ariaLabel,
}: {
  icon: ReactNode;
  title: string;
  secondary?: ReactNode;
  trailing?: ReactNode;
  onOpen?: () => void;
  ariaLabel: string;
}) {
  const interactive = Boolean(onOpen);
  const body = (
    <>
      <span
        className="mt-0.5 inline-flex shrink-0"
        style={{ color: "var(--luxia-purple-60)" }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {title}
        </span>
        {secondary ? (
          <span className="mt-0.5 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {secondary}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0 self-center">{trailing}</span> : null}
      {interactive ? (
        <span
          className="inline-flex shrink-0 self-center"
          style={{ color: "var(--luxia-text-muted)" }}
          aria-hidden
        >
          <LuxiaArrowRightIcon size={14} color="currentColor" />
        </span>
      ) : null}
    </>
  );

  return (
    <li className="luxia-settings-row">
      {interactive ? (
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onOpen}
          className="flex w-full min-w-0 items-start gap-3 py-3 text-left outline-none transition-colors hover:bg-[var(--luxia-settings-hover-bg)] focus-visible:bg-[var(--luxia-settings-hover-bg)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-settings-tab-focus-ring)]"
        >
          {body}
        </button>
      ) : (
        <div className="flex w-full min-w-0 items-start gap-3 py-3">
          {body}
        </div>
      )}
    </li>
  );
}

function ImpactInfoCallout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-w-0 items-start gap-2.5 rounded-[var(--luxia-radius-12)] px-3.5 py-3"
      style={{
        background: "var(--luxia-settings-section-bg)",
        border: "1px solid var(--luxia-settings-section-border)",
      }}
      role="note"
    >
      <CircleAlert
        size={15}
        strokeWidth={1.75}
        aria-hidden
        className="mt-0.5 shrink-0"
        style={{ color: "var(--luxia-text-muted)" }}
      />
      <p className="min-w-0 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        {children}
      </p>
    </div>
  );
}

export interface AccessLevelEditorPageProps {
  record: AccessLevelRecord;
  otherLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
  organizationUsers?: OrganizationUser[];
  onSave: (record: AccessLevelRecord) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onNavigateHome: () => void;
  onOpenAccessLevels: () => void;
  onOpenDataSourceSettings?: (dataSourceId: string) => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  onOpenProject?: (projectId: string) => void;
  projectNames?: Record<string, string>;
  /**
   * When false: disables Save/Create, hides Delete/Archive, and makes fields
   * (inputs/checkboxes/selects) read-only. Defaults to true.
   */
  canAdminister?: boolean;
}

export function AccessLevelEditorPage({
  record,
  otherLevels,
  dataSources = DATA_SOURCE_CATALOG,
  organizationUsers: organizationUsersProp,
  onSave,
  onCancel,
  onDelete,
  onNavigateHome,
  onOpenAccessLevels,
  onOpenDataSourceSettings,
  onOpenConstellationSettings,
  onOpenProject,
  canAdminister = true,
}: AccessLevelEditorPageProps) {
  const organizationUsers = organizationUsersProp ?? getOrganizationUsers();
  const initialRef = useRef(record);
  const [draft, setDraft] = useState(() => structuredClone(record));
  const [memberQuery, setMemberQuery] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<AccessLevelEditorSectionId>("general");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<"home" | "list">("list");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingMemberRemove, setPendingMemberRemove] = useState<string | null>(
    null,
  );
  const [pendingSourceRemove, setPendingSourceRemove] = useState<string | null>(
    null,
  );

  const isNew = Boolean(draft.isNew);
  const isDirty = !recordsEqual(draft, initialRef.current);
  const readOnly = !canAdminister;

  useEffect(() => {
    initialRef.current = record;
    setDraft(structuredClone(record));
    setNameError(null);
    setSaveNotice(null);
  }, [record]);

  const visibleSections = useMemo(
    () =>
      ACCESS_LEVEL_EDITOR_SECTIONS.filter(
        (section) => !(section.id === "lifecycle" && isNew),
      ),
    [isNew],
  );

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection("general");
    }
  }, [visibleSections, activeSection]);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "access-levels",
      label: "Access Levels",
      destination: { kind: "access-levels" },
    },
    {
      id: "current",
      label: isNew
        ? LUXIA_CREATE_VS_EDIT.accessLevel.createTitle
        : draft.name || "Access Level",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: () => {
      if (isDirty) {
        setLeaveTarget("home");
        setLeaveOpen(true);
        return;
      }
      onNavigateHome();
    },
    onAccessLevels: () => {
      if (isDirty) {
        setLeaveTarget("list");
        setLeaveOpen(true);
        return;
      }
      onOpenAccessLevels();
    },
  };

  const filteredUsers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return organizationUsers.filter((user) => {
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q)
        || user.email.toLowerCase().includes(q)
      );
    });
  }, [memberQuery, organizationUsers]);

  const filteredSources = useMemo(() => {
    const q = sourceQuery.trim().toLowerCase();
    return dataSources.filter((source) => {
      if (!q) return true;
      return (
        source.name.toLowerCase().includes(q)
        || source.type.toLowerCase().includes(q)
        || getDataSourceOwnerDisplay(source).toLowerCase().includes(q)
      );
    });
  }, [sourceQuery, dataSources]);

  const impactPreview = useMemo(
    () => buildAccessLevelImpactPreview(draft),
    [draft],
  );

  const validateName = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim();
      if (!trimmed) return "Name is required.";
      const duplicate = otherLevels.some(
        (level) =>
          level.id !== draft.id
          && level.name.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) return "An Access Level with this name already exists.";
      return null;
    },
    [draft.id, otherLevels],
  );

  function handleSave(event?: FormEvent) {
    event?.preventDefault();
    if (!canAdminister) return;

    const error = validateName(draft.name);
    if (error) {
      setNameError(error);
      setActiveSection("general");
      return;
    }

    const saved: AccessLevelRecord = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      updatedAt: new Date().toISOString(),
      isNew: undefined,
    };

    onSave(saved);
    initialRef.current = saved;
    setDraft(structuredClone(saved));
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function requestCancel() {
    if (isNew) {
      if (isDirty) {
        setLeaveTarget("list");
        setLeaveOpen(true);
        return;
      }
      onCancel();
      return;
    }

    if (isDirty) {
      setDraft(structuredClone(initialRef.current));
      setNameError(null);
      setSaveNotice(null);
      return;
    }

    onCancel();
  }

  function confirmLeave() {
    setLeaveOpen(false);
    setDraft(structuredClone(initialRef.current));
    setNameError(null);
    setSaveNotice(null);
    if (leaveTarget === "home") {
      onNavigateHome();
      return;
    }
    onCancel();
  }

  function toggleMember(userId: string, checked: boolean) {
    if (checked) {
      setDraft((prev) => ({
        ...prev,
        memberUserIds: [...prev.memberUserIds, userId],
      }));
      setSaveNotice(null);
      return;
    }
    setPendingMemberRemove(userId);
  }

  function confirmMemberRemove() {
    if (!pendingMemberRemove) return;
    setDraft((prev) => ({
      ...prev,
      memberUserIds: prev.memberUserIds.filter(
        (id) => id !== pendingMemberRemove,
      ),
    }));
    setPendingMemberRemove(null);
    setSaveNotice(null);
  }

  function getGrant(dataSourceId: string): AccessLevelSourceGrant | undefined {
    return draft.sourceGrants.find(
      (grant) => grant.dataSourceId === dataSourceId,
    );
  }

  function toggleSource(dataSourceId: string, checked: boolean) {
    const source = dataSources.find((item) => item.id === dataSourceId);
    if (checked) {
      if (source && !isDataSourceUsable(source.status)) {
        return;
      }
      setDraft((prev) => {
        if (prev.sourceGrants.some((g) => g.dataSourceId === dataSourceId)) {
          return prev;
        }
        return {
          ...prev,
          sourceGrants: [
            ...prev.sourceGrants,
            { dataSourceId, permission: "View" as AccessLevelPermission },
          ],
        };
      });
      setSaveNotice(null);
      return;
    }
    setPendingSourceRemove(dataSourceId);
  }

  function confirmSourceRemove() {
    if (!pendingSourceRemove) return;
    setDraft((prev) => ({
      ...prev,
      sourceGrants: prev.sourceGrants.filter(
        (grant) => grant.dataSourceId !== pendingSourceRemove,
      ),
    }));
    setPendingSourceRemove(null);
    setSaveNotice(null);
  }

  function setSourcePermission(
    dataSourceId: string,
    permission: AccessLevelPermission,
  ) {
    setDraft((prev) => ({
      ...prev,
      sourceGrants: prev.sourceGrants.map((grant) =>
        grant.dataSourceId === dataSourceId ? { ...grant, permission } : grant,
      ),
    }));
  }

  function handleArchive() {
    if (readOnly || draft.status === "inactive") return;
    setDraft((prev) => ({ ...prev, status: "inactive" }));
    setSaveNotice(null);
  }

  function handleReactivate() {
    if (readOnly || draft.status === "active") return;
    setDraft((prev) => ({ ...prev, status: "active" }));
    setSaveNotice(null);
  }

  const pageTitle = isNew
    ? LUXIA_CREATE_VS_EDIT.accessLevel.createTitle
    : draft.name || "Access Level";

  const formSaveLabel = isNew
    ? LUXIA_CREATE_VS_EDIT.accessLevel.createPrimary
    : LUXIA_DIRTY_STATE_COPY.save;

  const formDirty = isDirty || isNew;
  const archivePending =
    isDirty
    && draft.status === "inactive"
    && initialRef.current.status === "active";
  const reactivatePending =
    isDirty
    && draft.status === "active"
    && initialRef.current.status === "inactive";

  return (
    <LuxiaPageFrame variant={ACCESS_LEVELS_GUIDANCE.pageVariant}>
      <LuxiaPageHeadingRegion>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ACCESS LEVEL"
        title={pageTitle}
        titleStyle={{ color: HS.sectionHeading }}
        titleMetadata={
          readOnly ? (
            <LuxiaPageReadOnlyBadge
              ariaLabel="Read only. Only Organization Admins can edit Access Levels."
            />
          ) : undefined
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={
          readOnly
            ? ACCESS_LEVELS_GUIDANCE.editorPageDescriptionReadOnly
            : ACCESS_LEVELS_GUIDANCE.editorPageDescriptionEditable
        }
        primaryAction={null}
        secondaryAction={null}
        actions={<LuxiaAccessGuide />}
        context={
          !isNew && draft.updatedAt ? (
            <LuxiaPageEntityUpdatedMeta
              updatedAt={formatAccessLevelUpdatedAt(draft.updatedAt)}
            />
          ) : null
        }
      />
      </LuxiaPageHeadingRegion>

      <LuxiaPageBody>
        <form onSubmit={handleSave}>
          <Tabs
            value={activeSection}
            className="w-full min-w-0 gap-0"
            onValueChange={(value) => {
              if (
                !visibleSections.some((section) => section.id === value)
              ) {
                return;
              }
              if (value === activeSection) return;
              setActiveSection(value as AccessLevelEditorSectionId);
            }}
          >
            <div className="mb-4 w-full min-w-0 overflow-x-auto">
              <TabsList
                aria-label="Access Level editor sections"
                className={LUXIA_SETTINGS_TABLIST_CLASS}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${visibleSections.length}, minmax(0, 1fr))`,
                  width: "100%",
                  minWidth: `${visibleSections.length * 8.8}rem`,
                  boxSizing: "border-box",
                }}
              >
                {visibleSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    title={section.label}
                    className={LUXIA_SETTINGS_TAB_TRIGGER_CLASS}
                  >
                    <span className="block w-full truncate text-center">
                      {section.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className={`w-full min-w-0 ${PARENT_SURFACE_CLASS}`}>
              <TabsContent value="general" className={SETTINGS_TAB_PANEL_CLASS}>
                {readOnly ? (
                  <dl className={`space-y-4 ${SETTINGS_FORM_COLUMN_CLASS}`}>
                    <div>
                      <dt
                        className="luxia-type-metadata"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Name
                      </dt>
                      <dd
                        className="mt-1 luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {draft.name || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="luxia-type-metadata"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Description
                      </dt>
                      <dd
                        className="mt-1 luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {draft.description.trim() || "No description"}
                      </dd>
                    </div>
                    <div>
                      <dt
                        className="luxia-type-metadata"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Status
                      </dt>
                      <dd
                        className="mt-1 luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {draft.status === "active" ? "Active" : "Inactive"}
                      </dd>
                    </div>
                    {draft.status === "inactive" ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Inactive Access Levels keep their members and permissions but
                        no longer grant effective Data Source access.
                      </p>
                    ) : null}
                  </dl>
                ) : (
                  <div className={`space-y-4 ${SETTINGS_FORM_COLUMN_CLASS}`}>
                    <FilterField label="Name" htmlFor="al-name">
                      <Input
                        id="al-name"
                        value={draft.name}
                        onChange={(event) => {
                          setDraft((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }));
                          if (nameError) setNameError(null);
                          setSaveNotice(null);
                        }}
                        placeholder="Access level name"
                        aria-invalid={Boolean(nameError)}
                      />
                    </FilterField>
                    {nameError ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-error)" }}
                      >
                        {nameError}
                      </p>
                    ) : null}

                    <FilterField label="Description" htmlFor="al-description">
                      <Textarea
                        id="al-description"
                        value={draft.description}
                        onChange={(event) => {
                          setDraft((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }));
                          setSaveNotice(null);
                        }}
                        placeholder="Describe who this level is for"
                        rows={3}
                      />
                    </FilterField>

                    <BrowserFilterSelect
                      label="Status"
                      value={draft.status}
                      onChange={(event) => {
                        setDraft((prev) => ({
                          ...prev,
                          status: event.target.value as AccessLevelRecord["status"],
                        }));
                        setSaveNotice(null);
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </BrowserFilterSelect>
                    <p
                      className="luxia-type-caption -mt-2"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      Inactive Access Levels keep their members and permissions but
                      no longer grant effective Data Source access.
                    </p>
                  </div>
                )}

                <LuxiaSettingsFormActions
                  dirty={formDirty}
                  canSave={canAdminister}
                  saveLabel={formSaveLabel}
                  onSave={() => handleSave()}
                  onCancel={requestCancel}
                />
              </TabsContent>

              <TabsContent value="members" className={SETTINGS_TAB_PANEL_CLASS}>
                {readOnly ? (
                  <div className="space-y-4">
                    <p
                      className="luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Organization users included in this Access Level.
                    </p>
                    {draft.memberUserIds.length === 0 ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        This Access Level does not include any members yet.
                      </p>
                    ) : (
                      <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} px-4`}>
                        {draft.memberUserIds.map((userId) => {
                          const user = getOrganizationUserById(userId);
                          return (
                            <li
                              key={userId}
                              className="luxia-settings-row flex items-start gap-3 py-3.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className="luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  {user?.name ?? userId}
                                </p>
                                <p
                                  className="mt-0.5 luxia-type-caption"
                                  style={{ color: "var(--luxia-text-secondary)" }}
                                >
                                  {user?.email ?? "—"}
                                </p>
                                <p
                                  className="mt-0.5 luxia-type-caption"
                                  style={{ color: "var(--luxia-text-secondary)" }}
                                >
                                  Organization role: {user?.orgRole ?? "—"}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Assign organization users to this Access Level.
                      </p>
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {draft.memberUserIds.length} of {organizationUsers.length}{" "}
                        selected
                      </p>
                    </div>
                    {draft.memberUserIds.length === 0 ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        This Access Level does not include any members yet.
                      </p>
                    ) : null}
                    <label className="block max-w-md">
                      <span className="sr-only">Search members</span>
                      <div className="relative">
                        <Search
                          size={16}
                          strokeWidth={1.75}
                          aria-hidden
                          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                          style={{ color: "var(--luxia-text-muted)" }}
                        />
                        <Input
                          value={memberQuery}
                          onChange={(event) =>
                            setMemberQuery(event.target.value)
                          }
                          placeholder="Search users"
                          aria-label="Search users"
                          className="pl-9"
                        />
                      </div>
                    </label>
                    {filteredUsers.length === 0 ? (
                      <p
                        className="luxia-type-body-dense py-6 text-center"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        No users match your search.
                      </p>
                    ) : (
                      <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} px-4`}>
                        {filteredUsers.map((user) => {
                          const checked = draft.memberUserIds.includes(user.id);
                          const inputId = `member-${user.id}`;
                          return (
                            <li
                              key={user.id}
                              className={`luxia-settings-row flex items-start gap-3 py-3.5 ${checked ? "is-selected" : ""}`}
                            >
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                className="mt-0.5"
                                onCheckedChange={(value) => {
                                  toggleMember(user.id, value === true);
                                  setSaveNotice(null);
                                }}
                              />
                              <Label
                                htmlFor={inputId}
                                className="min-w-0 flex-1 cursor-pointer"
                              >
                                <span
                                  className="block luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  {user.name}
                                </span>
                                <span
                                  className="mt-0.5 block luxia-type-caption"
                                  style={{ color: "var(--luxia-text-secondary)" }}
                                >
                                  {user.email}
                                </span>
                                <span
                                  className="mt-0.5 block luxia-type-caption"
                                  style={{ color: "var(--luxia-text-secondary)" }}
                                >
                                  Organization role: {user.orgRole}
                                </span>
                              </Label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                <LuxiaSettingsFormActions
                  dirty={formDirty}
                  canSave={canAdminister}
                  saveLabel={formSaveLabel}
                  onSave={() => handleSave()}
                  onCancel={requestCancel}
                />
              </TabsContent>

              <TabsContent
                value="sources-permissions"
                className={SETTINGS_TAB_PANEL_CLASS}
              >
                {readOnly ? (
                  <div className="space-y-4">
                    <LuxiaPageGuide>
                      {ACCESS_LEVELS_GUIDANCE.sourcesPermissionHierarchy} View does
                      not allow Constellation use where Use is required.
                    </LuxiaPageGuide>
                    <p
                      className="luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Data Sources included in this Access Level and the Data Source
                      permission granted to members.
                    </p>
                    {draft.sourceGrants.length === 0 ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        No Data Sources have been added to this Access Level.
                      </p>
                    ) : (
                      <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} px-4`}>
                        {draft.sourceGrants.map((grant) => {
                          const source = dataSources.find((item) => item.id === grant.dataSourceId);
                          if (!source) return null;
                          return (
                            <li
                              key={grant.dataSourceId}
                              className="luxia-settings-row flex flex-wrap items-start justify-between gap-3 py-3.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className="luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  {source.name}
                                </p>
                                <p
                                  className="mt-0.5 luxia-type-caption"
                                  style={{ color: "var(--luxia-text-muted)" }}
                                >
                                  {formatDataSourceType(source.type)}
                                  {" · "}
                                  {source.ownership === "organizational"
                                    ? `Organizational · ${ORGANIZATIONAL_MANAGED_LABEL}`
                                    : `Private · owner ${getDataSourceOwnerDisplay(source)}`}
                                  {" · "}
                                  {sourceStatusLabel(source.status)}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p
                                  className="luxia-type-metadata"
                                  style={{ color: "var(--luxia-text-muted)" }}
                                >
                                  Data Source permission
                                </p>
                                <p
                                  className="mt-0.5 luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  {grant.permission}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <LuxiaPageGuide>
                      {ACCESS_LEVELS_GUIDANCE.sourcesPermissionHierarchy} View does
                      not allow Constellation use where Use is required.
                    </LuxiaPageGuide>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {ACCESS_LEVELS_GUIDANCE.sourcesPermissionsDescription}
                      </p>
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {draft.sourceGrants.length} of {dataSources.length}{" "}
                        selected
                      </p>
                    </div>
                    {draft.sourceGrants.length === 0 ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        No Data Sources have been added to this Access Level.
                      </p>
                    ) : null}
                    <label className="block max-w-md">
                      <span className="sr-only">Search Data Sources</span>
                      <div className="relative">
                        <Search
                          size={16}
                          strokeWidth={1.75}
                          aria-hidden
                          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                          style={{ color: "var(--luxia-text-muted)" }}
                        />
                        <Input
                          value={sourceQuery}
                          onChange={(event) =>
                            setSourceQuery(event.target.value)
                          }
                          placeholder="Search Data Sources"
                          aria-label="Search Data Sources"
                          className="pl-9"
                        />
                      </div>
                    </label>
                    {filteredSources.length === 0 ? (
                      <p
                        className="luxia-type-body-dense py-6 text-center"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        No Data Sources match your search.
                      </p>
                    ) : (
                      <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} px-4`}>
                        {filteredSources.map((source) => {
                          const grant = getGrant(source.id);
                          const checked = Boolean(grant);
                          const usable = isDataSourceUsable(source.status);
                          const cannotAdd = !usable && !checked;
                          const inputId = `source-${source.id}`;
                          return (
                            <li
                              key={source.id}
                              className={`luxia-settings-row flex flex-wrap items-center gap-3 py-3.5 ${checked ? "is-selected" : ""}`}
                            >
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                disabled={cannotAdd}
                                className="mt-0.5"
                                title={
                                  cannotAdd
                                    ? "Inactive or archived Data Sources cannot be newly selected."
                                    : undefined
                                }
                                onCheckedChange={(value) =>
                                  toggleSource(source.id, value === true)
                                }
                              />
                              <Label
                                htmlFor={inputId}
                                className={`min-w-0 flex-1 ${cannotAdd ? "cursor-default" : "cursor-pointer"}`}
                              >
                                <span
                                  className="block luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  {source.name}
                                </span>
                                <span
                                  className="mt-0.5 block luxia-type-caption"
                                  style={{ color: "var(--luxia-text-muted)" }}
                                >
                                  {formatDataSourceType(source.type)}
                                  {" · "}
                                  {source.ownership === "organizational"
                                    ? `Organizational · ${ORGANIZATIONAL_MANAGED_LABEL}`
                                    : `Private · owner ${getDataSourceOwnerDisplay(source)}`}
                                  {" · "}
                                  {sourceStatusLabel(source.status)}
                                </span>
                                {cannotAdd ? (
                                  <span
                                    className="mt-0.5 block luxia-type-caption"
                                    style={{ color: "var(--luxia-text-muted)" }}
                                  >
                                    Cannot newly grant an inactive or archived Data Source.
                                  </span>
                                ) : null}
                              </Label>
                              {checked && grant ? (
                                <Select
                                  value={grant.permission}
                                  onValueChange={(value) => {
                                    setSourcePermission(
                                      source.id,
                                      value as AccessLevelPermission,
                                    );
                                    setSaveNotice(null);
                                  }}
                                >
                                  <SelectTrigger
                                    className="w-[8.5rem]"
                                    size="sm"
                                    aria-label={`Data Source permission for ${source.name}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="View">View</SelectItem>
                                    <SelectItem value="Use">Use</SelectItem>
                                    <SelectItem value="Manage">Manage</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                <LuxiaSettingsFormActions
                  dirty={formDirty}
                  canSave={canAdminister}
                  saveLabel={formSaveLabel}
                  onSave={() => handleSave()}
                  onCancel={requestCancel}
                />
              </TabsContent>

              <TabsContent value="impact" className={SETTINGS_TAB_PANEL_CLASS}>
                <div className="space-y-4">
                  <div>
                    <h2
                      className="luxia-type-body-default-strong"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      Impact preview
                    </h2>
                    <p
                      className="mt-1 luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Impact preview based on the current prototype data
                      {isDirty ? " (includes unsaved draft changes)" : ""}.
                    </p>
                  </div>

                  <ImpactInfoCallout>
                    {draft.status !== "active"
                      ? "This Access Level is inactive, so configured grants do not contribute to effective permission."
                      : impactPreview.dataSources.length === 0
                        ? "Saving with no Data Sources means members receive no source grants from this level."
                        : "After saving, members receive the strongest active permission across all Access Levels they belong to. Removing grants may make related Constellations unavailable for Use."}
                  </ImpactInfoCallout>

                  <div
                    className="luxia-settings-section-surface overflow-hidden"
                    style={{ padding: 0 }}
                  >
                    <div className="px-4 pt-4">
                      <ImpactSectionHeader
                        title="Members affected"
                        countLabel={`${impactPreview.members.length} ${impactPreview.members.length === 1 ? "member" : "members"}`}
                      />
                      {impactPreview.members.length === 0 ? (
                        <p className="luxia-type-body-dense pb-4" style={{ color: "var(--luxia-text-secondary)" }}>
                          No members assigned yet.
                        </p>
                      ) : (
                        <ul>
                          {impactPreview.members.map((member) => {
                            const user = getOrganizationUserById(member.id);
                            return (
                              <ImpactEntityRow
                                key={member.id}
                                ariaLabel={member.name}
                                icon={
                                  <span
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full luxia-type-caption"
                                    style={{
                                      background: "var(--luxia-opacity-brand-secondary-12)",
                                      color: "var(--luxia-purple-70)",
                                    }}
                                    aria-hidden
                                  >
                                    {userInitials(member.name)}
                                  </span>
                                }
                                title={member.name}
                                secondary={
                                  user
                                    ? `Organization role: ${user.orgRole}`
                                    : "Assigned to this Access Level"
                                }
                              />
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div
                      className="px-4"
                      style={{ borderTop: "1px solid var(--luxia-settings-row-divider)" }}
                    >
                      <div className="pt-4">
                        <ImpactSectionHeader
                          title="Data Sources included"
                          countLabel={`${impactPreview.dataSources.length} Data Source${impactPreview.dataSources.length === 1 ? "" : "s"}`}
                        />
                      </div>
                      {impactPreview.dataSources.length === 0 ? (
                        <p className="luxia-type-body-dense pb-4" style={{ color: "var(--luxia-text-secondary)" }}>
                          No Data Sources included yet.
                        </p>
                      ) : (
                        <ul>
                          {impactPreview.dataSources.map((item) => {
                            const source = dataSources.find((entry) => entry.id === item.id);
                            const ownershipLabel = source
                              ? source.ownership === "organizational"
                                ? "Organizational"
                                : "Private"
                              : null;
                            const metaParts = [
                              source ? formatDataSourceType(source.type) : null,
                              ownershipLabel,
                              source && source.status !== "active"
                                ? sourceStatusLabel(source.status)
                                : null,
                            ].filter(Boolean);
                            return (
                              <ImpactEntityRow
                                key={item.id}
                                ariaLabel={`Open ${item.name}`}
                                icon={<LuxiaDatasourceIcon size={18} aria-hidden color="currentColor" />}
                                title={item.name}
                                secondary={
                                  <>
                                    {metaParts.join(" · ")}
                                    <span className="mt-0.5 block">
                                      Data Source permission: {item.permission}
                                    </span>
                                  </>
                                }
                                onOpen={
                                  onOpenDataSourceSettings
                                    ? () => onOpenDataSourceSettings(item.id)
                                    : undefined
                                }
                              />
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div
                      className="px-4"
                      style={{ borderTop: "1px solid var(--luxia-settings-row-divider)" }}
                    >
                      <div className="pt-4">
                        <ImpactSectionHeader
                          title="Constellations using these sources"
                          countLabel={`${impactPreview.constellations.length} Constellation${impactPreview.constellations.length === 1 ? "" : "s"}`}
                        />
                      </div>
                      {impactPreview.constellations.length === 0 ? (
                        <p className="luxia-type-body-dense pb-4" style={{ color: "var(--luxia-text-secondary)" }}>
                          No Constellations currently use these Data Sources.
                        </p>
                      ) : (
                        <ul>
                          {impactPreview.constellations.map((item) => (
                            <ImpactEntityRow
                              key={item.id}
                              ariaLabel={`Open ${item.name}`}
                              icon={<LuxiaConstellationIcon size={18} aria-hidden color="currentColor" />}
                              title={item.name}
                              secondary={item.projectName}
                              onOpen={
                                onOpenConstellationSettings
                                  ? () => onOpenConstellationSettings(item.projectId, item.id)
                                  : undefined
                              }
                            />
                          ))}
                        </ul>
                      )}
                    </div>

                    <div
                      className="px-4 pb-4"
                      style={{ borderTop: "1px solid var(--luxia-settings-row-divider)" }}
                    >
                      <div className="pt-4">
                        <ImpactSectionHeader
                          title="Projects indirectly affected"
                          countLabel={`${impactPreview.projects.length} Project${impactPreview.projects.length === 1 ? "" : "s"}`}
                        />
                      </div>
                      {impactPreview.projects.length === 0 ? (
                        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                          No Projects currently depend on these grants.
                        </p>
                      ) : (
                        <ul>
                          {impactPreview.projects.map((item) => {
                            const affectedCount = impactPreview.constellations.filter(
                              (constellation) => constellation.projectId === item.id,
                            ).length;
                            return (
                              <ImpactEntityRow
                                key={item.id}
                                ariaLabel={`Open ${item.name}`}
                                icon={<LuxiaProjectsIcon size={18} aria-hidden color="currentColor" />}
                                title={item.name}
                                secondary={
                                  affectedCount > 0
                                    ? `${affectedCount} affected Constellation${affectedCount === 1 ? "" : "s"}`
                                    : undefined
                                }
                                onOpen={
                                  onOpenProject
                                    ? () => onOpenProject(item.id)
                                    : undefined
                                }
                              />
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {!isNew ? (
                <TabsContent
                  value="lifecycle"
                  className={SETTINGS_TAB_PANEL_CLASS}
                >
                  {readOnly ? (
                    <div className="space-y-4">
                      <dl className={`space-y-4 ${SETTINGS_FORM_COLUMN_CLASS}`}>
                        <div>
                          <dt
                            className="luxia-type-metadata"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            Status
                          </dt>
                          <dd
                            className="mt-1 luxia-type-body-dense"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {draft.status === "active" ? "Active" : "Inactive"}
                          </dd>
                        </div>
                      </dl>
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {draft.status === "inactive"
                          ? "This Access Level is inactive. Its members and permissions remain configured, but it no longer grants effective Data Source access."
                          : "This Access Level is active. Only Organization Admins can archive or delete Access Levels."}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`}
                      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                    >
                      <div className="luxia-settings-row flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p
                            className="luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {draft.status === "inactive"
                              ? "Reactivate this Access Level"
                              : "Archive this Access Level"}
                          </p>
                          <p
                            className="mt-1 luxia-type-body-dense"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {draft.status === "inactive"
                              ? "Sets this Access Level back to active so its configured members and permissions can grant effective Data Source access again."
                              : "Sets this Access Level to inactive. Its members and permissions remain configured, but it no longer grants effective Data Source access."}
                          </p>
                          {archivePending ? (
                            <p
                              className="mt-1 luxia-type-caption"
                              style={{ color: "var(--luxia-text-secondary)" }}
                            >
                              Set to inactive in this draft — save changes to apply.
                            </p>
                          ) : null}
                          {reactivatePending ? (
                            <p
                              className="mt-1 luxia-type-caption"
                              style={{ color: "var(--luxia-text-secondary)" }}
                            >
                              Set to active in this draft — save changes to apply.
                            </p>
                          ) : null}
                        </div>
                        {draft.status === "inactive" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            className="shrink-0 self-start sm:self-center"
                            onClick={handleReactivate}
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="compact"
                            className="shrink-0 self-start sm:self-center"
                            onClick={handleArchive}
                          >
                            Archive
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p
                            className="luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-error)" }}
                          >
                            Delete this Access Level
                          </p>
                          <p
                            className="mt-1 luxia-type-body-dense"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            Removes this Access Level only. Data Sources are not
                            deleted. Affected users may lose effective source access
                            from this level.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="compact"
                          className="shrink-0 self-start sm:self-center"
                          onClick={() => setDeleteOpen(true)}
                        >
                          Delete Access Level
                        </Button>
                      </div>
                    </div>
                  )}

                  <LuxiaSettingsFormActions
                    dirty={formDirty}
                    canSave={canAdminister}
                    saveLabel={formSaveLabel}
                    onSave={() => handleSave()}
                    onCancel={requestCancel}
                  />
                </TabsContent>
              ) : null}
            </div>
          </Tabs>
        </form>
      </LuxiaPageBody>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isNew ? "Discard this Access Level draft?" : LUXIA_DIRTY_STATE_COPY.leaveTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isNew
                ? "Your draft has not been created. Discarding removes this draft for the current session."
                : LUXIA_DIRTY_STATE_COPY.leaveDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isNew ? "Keep editing" : LUXIA_DIRTY_STATE_COPY.cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              {isNew ? "Discard draft" : "Leave without saving"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingMemberRemove)}
        onOpenChange={(open) => !open && setPendingMemberRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMemberRemove
                ? `Remove ${organizationUsers.find((user) => user.id === pendingMemberRemove)?.name ?? "this user"} from this Access Level? They will lose ${draft.sourceGrants.length} Data Source grant${draft.sourceGrants.length === 1 ? "" : "s"} from this level only. Ownership and Project roles are unchanged. Save is still required to apply draft changes.`
                : "Removing a member revokes Data Source permissions granted through this Access Level."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep member</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMemberRemove}>
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingSourceRemove)}
        onOpenChange={(open) => !open && setPendingSourceRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Data Source?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSourceRemove
                ? `Remove ${dataSources.find((source) => source.id === pendingSourceRemove)?.name ?? "this Data Source"} from this Access Level only? The Data Source itself and Constellation connections stay intact. Other grants on this level are preserved. Save is still required.`
                : "Members of this Access Level will lose permission to the removed source."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep source</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSourceRemove}>
              Remove source
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Access Level?</AlertDialogTitle>
            <AlertDialogDescription>
              Members will lose the Data Source permissions granted by this Access Level. Data Sources and Constellations will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="luxia-button luxia-button--destructive"
              onClick={() => {
                onDelete(draft.id);
                setDeleteOpen(false);
              }}
            >
              Delete Access Level
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}
