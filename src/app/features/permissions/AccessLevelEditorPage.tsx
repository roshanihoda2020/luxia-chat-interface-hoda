import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
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
import { Textarea } from "@/app/components/ui/textarea";
import {
  LUXIA_CREATE_VS_EDIT,
  LUXIA_DIRTY_STATE_COPY,
} from "@/app/features/shared/luxiaSettingsUx";
import {
  BrowserFilterSelect,
  FilterField,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  DATA_SOURCE_CATALOG,
  MOCK_ACCESS_LEVEL_IMPACT,
  ORGANIZATION_USERS,
} from "./data";
import {
  ACCESS_LEVEL_EDITOR_SECTIONS,
  ACCESS_LEVELS_GUIDANCE,
} from "./ia";
import { LuxiaAccessGuide } from "./LuxiaAccessGuide";
import type {
  AccessLevelPermission,
  AccessLevelRecord,
  AccessLevelSourceGrant,
} from "./types";

const PARENT_SURFACE_STYLE = {
  background: "var(--luxia-surface)",
  border: "1px solid var(--luxia-border-default)",
  borderRadius: "var(--luxia-radius-12)",
} as const;

const SECTION_DIVIDER = {
  borderTop: "1px solid var(--luxia-border-subtle)",
} as const;

function recordsEqual(a: AccessLevelRecord, b: AccessLevelRecord): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export interface AccessLevelEditorPageProps {
  record: AccessLevelRecord;
  otherLevels: AccessLevelRecord[];
  onSave: (record: AccessLevelRecord) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onNavigateHome: () => void;
  onOpenAccessLevels: () => void;
  projectNames?: Record<string, string>;
}

export function AccessLevelEditorPage({
  record,
  otherLevels,
  onSave,
  onCancel,
  onDelete,
  onNavigateHome,
  onOpenAccessLevels,
}: AccessLevelEditorPageProps) {
  const initialRef = useRef(record);
  const [draft, setDraft] = useState(() => structuredClone(record));
  const [memberQuery, setMemberQuery] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
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

  useEffect(() => {
    initialRef.current = record;
    setDraft(structuredClone(record));
    setNameError(null);
    setSaveNotice(null);
  }, [record]);

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
    return ORGANIZATION_USERS.filter((user) => {
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q)
        || user.email.toLowerCase().includes(q)
      );
    });
  }, [memberQuery]);

  const filteredSources = useMemo(() => {
    const q = sourceQuery.trim().toLowerCase();
    return DATA_SOURCE_CATALOG.filter((source) => {
      if (!q) return true;
      return (
        source.name.toLowerCase().includes(q)
        || source.type.toLowerCase().includes(q)
      );
    });
  }, [sourceQuery]);

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
    const error = validateName(draft.name);
    if (error) {
      setNameError(error);
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
    setSaveNotice(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function requestCancel() {
    if (isDirty) {
      setLeaveTarget("list");
      setLeaveOpen(true);
      return;
    }
    onCancel();
  }

  function confirmLeave() {
    setLeaveOpen(false);
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
  }

  function getGrant(dataSourceId: string): AccessLevelSourceGrant | undefined {
    return draft.sourceGrants.find(
      (grant) => grant.dataSourceId === dataSourceId,
    );
  }

  function toggleSource(dataSourceId: string, checked: boolean) {
    if (checked) {
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

  const pageTitle = isNew
    ? LUXIA_CREATE_VS_EDIT.accessLevel.createTitle
    : draft.name || "Access Level";

  const primaryLabel = isNew
    ? LUXIA_CREATE_VS_EDIT.accessLevel.createPrimary
    : LUXIA_DIRTY_STATE_COPY.save;

  return (
    <LuxiaPageFrame variant={ACCESS_LEVELS_GUIDANCE.pageVariant}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ACCESS LEVEL"
        title={pageTitle}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={ACCESS_LEVELS_GUIDANCE.editorPageDescription}
        secondaryAction={
          <>
            <LuxiaAccessGuide />
            {!isNew ? (
              <Button
                type="button"
                {...LUXIA_PAGE_HEADER_ACTION.secondary}
                onClick={requestCancel}
              >
                {LUXIA_DIRTY_STATE_COPY.cancel}
              </Button>
            ) : null}
          </>
        }
        primaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.primary}
            disabled={!isNew && !isDirty}
            onClick={() => handleSave()}
          >
            {primaryLabel}
          </Button>
        }
        metadata={
          isDirty && !isNew ? (
            <p
              className="luxia-type-caption"
              style={{ color: "var(--luxia-purple-60)" }}
            >
              {LUXIA_DIRTY_STATE_COPY.unsaved}
            </p>
          ) : saveNotice ? (
            <p
              className="luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              {saveNotice}
            </p>
          ) : null
        }
      />

      <LuxiaPageBody>
        <form onSubmit={handleSave}>
          <div style={PARENT_SURFACE_STYLE}>
            {ACCESS_LEVEL_EDITOR_SECTIONS.map((section, sectionIndex) => {
              if (section.id === "danger" && isNew) {
                return null;
              }

              return (
                <section
                  key={section.id}
                  className="px-4 py-5"
                  style={sectionIndex > 0 ? SECTION_DIVIDER : undefined}
                >
                  <h2
                    className="mb-4 luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {section.label}
                  </h2>

                  {section.id === "general" ? (
                    <div className="space-y-4 max-w-xl">
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
                          }}
                          placeholder="Access Level name"
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
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              description: event.target.value,
                            }))
                          }
                          placeholder="Describe who this level is for"
                          rows={3}
                        />
                      </FilterField>

                      <BrowserFilterSelect
                        label="Status"
                        value={draft.status}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            status: event.target.value as AccessLevelRecord["status"],
                          }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </BrowserFilterSelect>
                      <p
                        className="luxia-type-caption -mt-2"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        Inactive levels stop granting new access but remain visible
                        for audit.
                      </p>
                    </div>
                  ) : null}

                  {section.id === "members" ? (
                    <div className="space-y-4">
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {ACCESS_LEVELS_GUIDANCE.membersLabel}: assign organization
                        users to this Access Level.
                      </p>
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
                      <ul>
                        {filteredUsers.map((user, index) => {
                          const checked = draft.memberUserIds.includes(user.id);
                          const inputId = `member-${user.id}`;
                          return (
                            <li
                              key={user.id}
                              className="flex items-start gap-3 py-3"
                              style={
                                index > 0 ? SECTION_DIVIDER : undefined
                              }
                            >
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleMember(user.id, value === true)
                                }
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
                                  className="block luxia-type-caption"
                                  style={{ color: "var(--luxia-text-muted)" }}
                                >
                                  {user.email} · {user.orgRole}
                                </span>
                              </Label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {section.id === "sources-permissions" ? (
                    <div className="space-y-4">
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {ACCESS_LEVELS_GUIDANCE.sourcesPermissionsDescription}
                      </p>
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
                      <ul>
                        {filteredSources.map((source, index) => {
                          const grant = getGrant(source.id);
                          const checked = Boolean(grant);
                          const inputId = `source-${source.id}`;
                          return (
                            <li
                              key={source.id}
                              className="flex flex-wrap items-center gap-3 py-3"
                              style={index > 0 ? SECTION_DIVIDER : undefined}
                            >
                              <Checkbox
                                id={inputId}
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleSource(source.id, value === true)
                                }
                              />
                              <Label
                                htmlFor={inputId}
                                className="min-w-0 flex-1 cursor-pointer"
                              >
                                <span
                                  className="block luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  {source.name}
                                </span>
                                <span
                                  className="block luxia-type-caption"
                                  style={{ color: "var(--luxia-text-muted)" }}
                                >
                                  {source.type} · {source.ownership}
                                  {source.ownership === "private"
                                    ? ` · owner ${source.ownerUserId}`
                                    : ""}
                                </span>
                              </Label>
                              {checked && grant ? (
                                <Select
                                  value={grant.permission}
                                  onValueChange={(value) =>
                                    setSourcePermission(
                                      source.id,
                                      value as AccessLevelPermission,
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className="w-[8.5rem]"
                                    size="sm"
                                    aria-label={`Permission for ${source.name}`}
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
                    </div>
                  ) : null}

                  {section.id === "impact" ? (
                    <div className="space-y-4">
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Read-only preview of dependent entities (prototype mock).
                      </p>
                      <div>
                        <h3
                          className="luxia-type-body-dense-strong mb-2"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          Constellations
                        </h3>
                        <ul
                          className="luxia-type-body-dense"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {MOCK_ACCESS_LEVEL_IMPACT.constellations.map((item) => (
                            <li key={item.id}>
                              {item.name} · {item.projectName}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3
                          className="luxia-type-body-dense-strong mb-2"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          Projects
                        </h3>
                        <ul
                          className="luxia-type-body-dense"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {MOCK_ACCESS_LEVEL_IMPACT.projects.map((item) => (
                            <li key={item.id}>{item.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  {section.id === "danger" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p
                          className="luxia-type-body-dense-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          Delete this Access Level
                        </p>
                        <p
                          className="mt-1 luxia-type-body-dense"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          Members lose grants from this level. Review Impact before
                          deleting.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="compact"
                        onClick={() => setDeleteOpen(true)}
                      >
                        Delete Access Level
                      </Button>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          {isNew ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={requestCancel}
              >
                {LUXIA_DIRTY_STATE_COPY.cancel}
              </Button>
            </div>
          ) : null}
        </form>
      </LuxiaPageBody>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{LUXIA_DIRTY_STATE_COPY.leaveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {LUXIA_DIRTY_STATE_COPY.leaveDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{LUXIA_DIRTY_STATE_COPY.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              Leave without saving
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
              Removing a member revokes Data Source permissions granted through
              this Access Level. Constellations that depend on those sources may
              become unreachable.
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
              Members of this Access Level will lose permission to the removed
              source. Review Impact for dependent constellations and projects.
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
            <AlertDialogTitle>Delete Access Level?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes grants for {draft.memberUserIds.length} member
              {draft.memberUserIds.length === 1 ? "" : "s"} across{" "}
              {draft.sourceGrants.length} Data Source
              {draft.sourceGrants.length === 1 ? "" : "s"}. Mock impact:{" "}
              {MOCK_ACCESS_LEVEL_IMPACT.constellations.length} constellations,{" "}
              {MOCK_ACCESS_LEVEL_IMPACT.projects.length} projects.
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
