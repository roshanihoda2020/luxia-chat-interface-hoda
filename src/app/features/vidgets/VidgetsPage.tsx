import { useMemo, useState, useSyncExternalStore } from "react";
import { Plus, Search, Share2 } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
import {
  BrowserFilterSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  FilterToolbar,
  FilterToolbarRow,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import {
  LuxiaVirtualAssistantIcon,
} from "@/assets/icons";
import { formatVidgetUpdatedAt, isVidgetDeploymentActive, resolveVidgetSourceDisplay } from "./data";
import { VidgetChannelMetaIcon, VidgetSourceMetaIcon } from "./vidgetMetaIcons";
import { VIDGETS_GUIDANCE } from "./ia";
import { VidgetsCollectionNav } from "./VidgetsCollectionNav";
import type { VidgetChannel, VidgetRecord, VidgetStatus } from "./types";
import {
  VIDGET_CHANNEL_LABELS,
  VIDGET_STATUS_LABELS,
} from "./types";
import { InboxShareDialog } from "@/app/features/vidget-inbox/InboxShareDialog";
import { getVidgetInboxSessionsForProject } from "@/app/features/vidget-inbox/fixture";
import {
  createVidgetInboxReviewShare,
  vidgetShareScope,
} from "@/app/features/vidget-inbox/share";
import {
  getVidgetInboxCaptureVersion,
  subscribeVidgetInboxCapture,
} from "@/app/features/vidget-inbox/sessionStore";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

type StatusFilter = "all" | VidgetStatus;
type ChannelFilter = "all" | VidgetChannel;

export interface VidgetsPageProps {
  projectId: string;
  projectName: string;
  galaxyName: string;
  projectGalaxyId: string | null;
  vidgets: VidgetRecord[];
  constellationNameById: Record<string, string>;
  constellationProjectById: Record<string, string>;
  canManage: boolean;
  canReviewInbox: boolean;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenInbox?: (vidgetId?: string) => void;
  onCreate: () => void;
  onOpen: (vidgetId: string) => void;
  onRename: (vidgetId: string, name: string) => void;
  onDuplicate: (vidgetId: string) => void;
  onDelete: (vidgetId: string) => void;
  onPreview?: (vidgetId: string) => void;
}

export function VidgetsPage({
  projectId,
  projectName,
  galaxyName,
  projectGalaxyId,
  vidgets,
  constellationNameById,
  constellationProjectById,
  canManage,
  canReviewInbox,
  onNavigateHome,
  onOpenProject,
  onOpenInbox,
  onCreate,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onPreview,
}: VidgetsPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareVidgetId, setShareVidgetId] = useState<string | null>(null);

  const captureVersion = useSyncExternalStore(
    subscribeVidgetInboxCapture,
    getVidgetInboxCaptureVersion,
    () => 0,
  );
  const accessibleVidgetIds = useMemo(
    () => new Set(vidgets.map((item) => item.id)),
    [vidgets],
  );
  const accessibleInboxSessions = useMemo(
    () => getVidgetInboxSessionsForProject(projectId, accessibleVidgetIds),
    [projectId, accessibleVidgetIds, captureVersion],
  );
  const vidgetShare = shareVidgetId
    ? vidgetShareScope(shareVidgetId, accessibleInboxSessions)
    : null;
  const sharingVidgetName = shareVidgetId
    ? vidgets.find((item) => item.id === shareVidgetId)?.name
    : undefined;

  function sourceFor(item: VidgetRecord) {
    const constellationId = item.constellationId;
    const constellation =
      constellationId
        ? constellationNameById[constellationId]
          ? {
              id: constellationId,
              projectId: constellationProjectById[constellationId] ?? "",
              name: constellationNameById[constellationId],
            }
          : null
        : undefined;
    const projectConstellations = Object.entries(constellationNameById)
      .filter(([, name]) => Boolean(name))
      .map(([id, name]) => ({
        id,
        projectId: constellationProjectById[id] ?? "",
        name,
      }))
      .filter((entry) => entry.projectId === projectId);
    return resolveVidgetSourceDisplay(item, {
      projectGalaxyId,
      galaxyName: galaxyName || null,
      constellation,
      projectConstellations,
    });
  }

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "project",
      label: projectName,
      destination: { kind: "project", projectId },
    },
    {
      id: "vidgets",
      label: "Vidgets",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vidgets.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (channelFilter !== "all" && item.channel !== channelFilter) return false;
      if (!q) return true;
      const source = sourceFor(item);
      const sourceName = source.available ? source.label : source.label;
      return (
        item.name.toLowerCase().includes(q)
        || VIDGET_CHANNEL_LABELS[item.channel].toLowerCase().includes(q)
        || sourceName.toLowerCase().includes(q)
      );
    });
  }, [
    vidgets,
    query,
    statusFilter,
    channelFilter,
    galaxyName,
    projectGalaxyId,
    constellationNameById,
    constellationProjectById,
  ]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setChannelFilter("all");
  }

  const pendingDelete = pendingDeleteId
    ? vidgets.find((item) => item.id === pendingDeleteId)
    : null;

  return (
    <LuxiaPageFrame variant={VIDGETS_GUIDANCE.listPageVariant}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="PROJECT EXPERIENCE"
        title="Vidgets"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={VIDGETS_GUIDANCE.listPageDescription}
        primaryAction={
          canManage ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              aria-label="Create Vidget"
              onClick={onCreate}
            >
              <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
              Create Vidget
            </Button>
          ) : null
        }
      />

      <LuxiaPageBody>
        {canReviewInbox ? (
          <VidgetsCollectionNav
            active="all"
            showInbox
            onChange={(view) => {
              if (view === "inbox") onOpenInbox?.();
            }}
          />
        ) : null}
        {vidgets.length === 0 ? (
          <div className="py-10">
            <div className="space-y-1.5">
              <h2
                className="luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                No Vidgets yet
              </h2>
              <p
                className="max-w-xl luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                Create an external AI experience from this Project’s Galaxy or a
                Constellation.
              </p>
            </div>
          </div>
        ) : (
          <>
            <FilterToolbar>
              <label className="block w-full max-w-full">
                <span className="sr-only">Search Vidgets</span>
                <div className="relative">
                  <Search
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                    style={{ color: "var(--luxia-text-muted)" }}
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, channel, or source"
                    aria-label="Search Vidgets"
                    className="h-10 w-full pl-9"
                    style={{
                      background: HS.searchBg,
                      borderColor: HS.searchBorder,
                    }}
                  />
                </div>
              </label>
              <FilterToolbarRow>
                <CollectionFilterBar>
                  <BrowserFilterSelect
                    label="Status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                  </BrowserFilterSelect>
                  <BrowserFilterSelect
                    label="Channel"
                    value={channelFilter}
                    onChange={(event) =>
                      setChannelFilter(event.target.value as ChannelFilter)
                    }
                  >
                    <option value="all">All</option>
                    <option value="web">Landing Page</option>
                    <option value="voip">VoIP</option>
                    <option value="whatsapp">WhatsApp</option>
                  </BrowserFilterSelect>
                </CollectionFilterBar>
              </FilterToolbarRow>
              <ResultsCount>
                {filtered.length} Vidget{filtered.length === 1 ? "" : "s"}
              </ResultsCount>
            </FilterToolbar>

            {filtered.length === 0 ? (
              <FilteredEmptyState title="No Vidgets match" onClear={clearFilters} />
            ) : (
              <div className={SURFACE}>
                <ul>
                  {filtered.map((item) => {
                    const source = sourceFor(item);
                    return (
                      <li
                        key={item.id}
                        className="luxia-settings-row is-interactive group/vidget flex flex-wrap items-start gap-3 px-4 py-4"
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[6px]"
                          onClick={() => onOpen(item.id)}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="inline-flex shrink-0 self-start"
                              style={{ color: "var(--luxia-purple-60)" }}
                              aria-hidden
                            >
                              <LuxiaVirtualAssistantIcon
                                size={16}
                                aria-hidden
                                color="currentColor"
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className="luxia-type-body-dense-strong"
                                style={{ color: "var(--luxia-text-primary)" }}
                              >
                                {item.name}
                              </p>
                              <div
                                className="mt-2 flex flex-wrap gap-x-4 gap-y-1 luxia-type-caption"
                                style={{ color: "var(--luxia-text-muted)" }}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <VidgetChannelMetaIcon channel={item.channel} />
                                  <span>{VIDGET_CHANNEL_LABELS[item.channel]}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  {item.sourceType === "galaxy" ? (
                                    <VidgetSourceMetaIcon sourceType="galaxy" />
                                  ) : (
                                    <VidgetSourceMetaIcon sourceType="constellation" />
                                  )}
                                  <span>
                                    {source.available
                                      ? item.sourceType === "galaxy"
                                        ? `Source: Galaxy · ${source.label}${
                                            source.scopeSummary
                                              ? ` · ${source.scopeSummary}`
                                              : ""
                                          }`
                                        : `Source: Constellation · ${source.label}`
                                      : source.label}
                                  </span>
                                </span>
                                <span>{VIDGET_STATUS_LABELS[item.status]}</span>
                                <span>{formatVidgetUpdatedAt(item.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {canReviewInbox ? (
                          <Button
                            type="button"
                            variant="tertiary"
                            size="compact"
                            className="mt-0.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover/vidget:opacity-100 lg:group-focus-within/vidget:opacity-100"
                            aria-label={`Share conversations for ${item.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setShareVidgetId(item.id);
                            }}
                          >
                            <Share2 size={14} strokeWidth={1.8} aria-hidden className="shrink-0" />
                            Share
                          </Button>
                        ) : null}

                        <LuxiaEntityOptionsMenu
                          entityLabel={item.name}
                          entityType="Vidget"
                          ariaLabel={`Actions for ${item.name}`}
                          items={[
                            {
                              id: "edit",
                              label: canManage ? "Edit" : "View details",
                              onSelect: () => onOpen(item.id),
                            },
                            ...(canReviewInbox && onOpenInbox
                              ? [
                                  {
                                    id: "review-conversations",
                                    label: "Review conversations",
                                    onSelect: () => onOpenInbox(item.id),
                                  },
                                  {
                                    id: "share-conversations",
                                    label: "Share conversations",
                                    onSelect: () => setShareVidgetId(item.id),
                                  },
                                ]
                              : []),
                            ...(canManage
                              ? [
                                  {
                                    id: "rename",
                                    label: "Rename",
                                    onSelect: () => {
                                      setRenameId(item.id);
                                      setRenameValue(item.name);
                                    },
                                  },
                                  {
                                    id: "duplicate",
                                    label: "Duplicate",
                                    onSelect: () => onDuplicate(item.id),
                                  },
                                ]
                              : []),
                            ...(isVidgetDeploymentActive(item)
                              ? [
                                  {
                                    id: "preview",
                                    label: "Preview",
                                    onSelect: () =>
                                      onPreview
                                        ? onPreview(item.id)
                                        : onOpen(item.id),
                                  },
                                  {
                                    id: "open-published",
                                    label: "Open published experience",
                                    onSelect: () => {
                                      if (item.hostedUrl) {
                                        window.open(item.hostedUrl, "_blank", "noopener,noreferrer");
                                      } else {
                                        onOpen(item.id);
                                      }
                                    },
                                  },
                                ]
                              : []),
                            ...(canManage
                              ? [
                                  {
                                    id: "delete",
                                    label: "Delete",
                                    destructive: true as const,
                                    separatorBefore: true,
                                    onSelect: () => setPendingDeleteId(item.id),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </LuxiaPageBody>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Vidget?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} will be removed. The Project Galaxy, Constellations, and Data Sources are not deleted.`
                : "This Vidget configuration will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="luxia-button luxia-button--destructive"
              onClick={() => {
                if (pendingDeleteId) onDelete(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete Vidget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(renameId)}
        onOpenChange={(open) => !open && setRenameId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Vidget</AlertDialogTitle>
            <AlertDialogDescription>
              Update the display name for this Vidget.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            aria-label="Vidget name"
            className="mx-6 my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (renameId && renameValue.trim()) {
                  onRename(renameId, renameValue.trim());
                }
                setRenameId(null);
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <InboxShareDialog
        open={vidgetShare !== null}
        onOpenChange={(open) => {
          if (!open) setShareVidgetId(null);
        }}
        scope={vidgetShare}
        vidgetNames={sharingVidgetName ? [sharingVidgetName] : []}
        vidgetName={sharingVidgetName}
        onShare={(anonymous) => {
          if (!vidgetShare) return;
          createVidgetInboxReviewShare({
            projectId,
            scope: vidgetShare,
            anonymous,
          });
        }}
      />
    </LuxiaPageFrame>
  );
}
