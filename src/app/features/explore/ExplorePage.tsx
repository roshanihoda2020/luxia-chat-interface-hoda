import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bot,
  BookOpen,
  Building2,
  Code2,
  Compass,
  Copy,
  Database,
  Factory,
  FileText,
  FlaskConical,
  Handshake,
  HardHat,
  Landmark,
  Lightbulb,
  Map as MapIcon,
  Megaphone,
  MessageSquareText,
  PenLine,
  Plus,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { LuxiaBreadcrumb, type LuxiaBreadcrumbItem } from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { HS } from "@/app/features/home/homeSurfaces";
import { getExplorePath } from "@/app/features/project/projectPaths";
import { LUXIA_SETTINGS_TAB_TRIGGER_CLASS, LUXIA_SETTINGS_TABLIST_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { exitExploreConceptDemo, getConceptMap } from "./demoMode";
import {
  AvailabilityBadge,
  ConceptDemoChip,
  ConceptLabel,
  KindChip,
  NewChip,
} from "./ExploreBadges";
import {
  EXPLORE_SECTION_LABELS,
  EXPLORE_UPDATE_KIND_LABELS,
  exploreMonthLabel,
  findExploreEntry,
  formatExploreDate,
} from "./exploreFeed";
import {
  markExploreEntryRead,
  resetDemoNotifications,
  setExplorePreference,
  type ExploreUserState,
} from "./exploreState";
import type {
  ExploreAction,
  ExploreAvailability,
  ExploreBlock,
  ExploreContentSectionId,
  ExploreEntry,
  ExploreIdea,
  ExploreIdentity,
  ExploreLearnItem,
  ExploreProduct,
  ExploreReturnTo,
  ExploreSectionId,
  ExploreService,
  ExploreStory,
  ExploreUpdate,
} from "./types";
import { useExploreFeed } from "./useExploreFeed";
import "./explore.css";

type Feed = ReturnType<typeof useExploreFeed>;
type OpenEntry = (entry: ExploreEntry) => void;

export interface ExplorePageProps {
  userId: string;
  /** Section from the URL; falls back to the first visible section. */
  section: ExploreSectionId | null;
  /** One entry's full page (its slug), or null for the section itself. */
  slug: string | null;
  /** Where the entry page was opened from (its Back link). */
  returnTo: ExploreReturnTo | null;
  onOpenEntry: (section: ExploreContentSectionId, slug: string, from: ExploreReturnTo) => void;
  onSectionChange: (section: ExploreSectionId) => void;
  onNavigateHome: () => void;
  onAction: (action: ExploreAction) => void;
}

/**
 * Explore Luxia: product discovery, education and updates, apart from the
 * workspace. Sections appear only when they have content customers may see
 * (Concept Demo shows every section, each illustration labelled). Every entry
 * opens as a full page in the app shell; nothing opens in a drawer or overlay.
 */
export function ExplorePage({ userId, section, slug, returnTo, onOpenEntry, onSectionChange, onNavigateHome, onAction }: ExplorePageProps) {
  const feed = useExploreFeed(userId);
  const sections = feed.sections;
  const current = section && sections.includes(section) ? section : sections[0];
  const detailSection = (section && section !== "overview" ? section : null) as ExploreContentSectionId | null;
  const entry = slug && detailSection ? findExploreEntry(feed.entries, detailSection, slug) : undefined;

  // Back from a page to its list: focus returns to the card or row that opened it.
  const lastSlug = useRef<string | null>(null);
  useEffect(() => {
    if (slug) {
      lastSlug.current = slug;
      return;
    }
    const id = lastSlug.current;
    lastSlug.current = null;
    if (!id) return;
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-explore-entry="${CSS.escape(id)}"]`)?.focus());
  }, [slug, current]);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    { id: "explore", label: "Explore Luxia", destination: { kind: "current" } },
  ];

  const open = (from: ExploreReturnTo): OpenEntry => (target) => onOpenEntry(target.section, target.id, from);

  const render = (id: ExploreSectionId) => {
    switch (id) {
      case "overview": return <OverviewSection feed={feed} onSectionChange={onSectionChange} onAction={onAction} onOpen={open("overview")} />;
      case "whats-new": return <WhatsNewSection userId={userId} feed={feed} onOpen={open("whats-new")} />;
      case "products": return <ProductsSection products={only<ExploreProduct>(feed.entries, "products")} conceptDemo={feed.conceptDemo} onAction={onAction} onOpen={open("products")} />;
      case "learn": return <LearnSection items={only<ExploreLearnItem>(feed.entries, "learn")} onOpen={open("learn")} />;
      case "ideas": return <IdeasSection ideas={only<ExploreIdea>(feed.entries, "ideas")} entries={feed.entries} onOpen={open("ideas")} />;
      case "stories": return <StoriesSection stories={only<ExploreStory>(feed.entries, "stories")} onOpen={open("stories")} />;
      case "services": return <ServicesSection services={only<ExploreService>(feed.entries, "services")} onOpen={open("services")} />;
    }
  };

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="EXPLORE"
        title="Explore Luxia"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={<LuxiaBreadcrumb tone="page" items={breadcrumbItems} handlers={{ onHome: onNavigateHome }} />}
        guide="Product updates, guides and what's coming to Luxia. Your workspace stays on Home."
      />
      <LuxiaPageBody>
        {feed.conceptDemo ? <ConceptDemoBanner userId={userId} feed={feed} /> : null}
        {slug && detailSection ? (
          <EntryPage
            userId={userId}
            feed={feed}
            section={detailSection}
            entry={entry}
            returnTo={returnTo ?? detailSection}
            onBack={() => {
              const target = returnTo ?? detailSection;
              if (target === "home") onNavigateHome();
              else onSectionChange(target);
            }}
            onOpen={open(returnTo ?? detailSection)}
            onAction={onAction}
          />
        ) : sections.length > 1 ? (
          <Tabs value={current} onValueChange={(next) => onSectionChange(next as ExploreSectionId)} className="gap-6">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList
                aria-label="Explore Luxia sections"
                className={`${LUXIA_SETTINGS_TABLIST_CLASS} !w-max !min-w-full`}
                style={{ display: "grid", gridTemplateColumns: `repeat(${sections.length}, minmax(max-content, 1fr))` }}
              >
                {sections.map((id) => (
                  <TabsTrigger key={id} value={id} className={`${LUXIA_SETTINGS_TAB_TRIGGER_CLASS} !px-3`} data-explore-tab={id}>
                    {EXPLORE_SECTION_LABELS[id]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {sections.map((id) => (
              <TabsContent key={id} value={id} className="m-0 outline-none" data-explore-section={id}>
                {id === current ? render(id) : null}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div data-explore-section="whats-new">{render("whats-new")}</div>
        )}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}

function only<T extends ExploreEntry>(entries: readonly ExploreEntry[], section: T["section"]): T[] {
  return entries.filter((entry): entry is T => entry.section === section);
}

/** A whole-card link to an entry's page (real anchor: works with keyboard, middle-click and screen readers). */
function EntryLink({ entry, onOpen, className = "", label, children }: { entry: ExploreEntry; onOpen: OpenEntry; className?: string; label?: string; children: ReactNode }) {
  return (
    <a
      href={getExplorePath(entry.section, entry.id)}
      className={className}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        onOpen(entry);
      }}
      data-explore-entry={entry.id}
      {...(entry.section === "whats-new" ? { "data-explore-update": entry.id } : {})}
    >
      {children}
    </a>
  );
}

// Concept Demo banner (internal builds only) with the notification reset

function ConceptDemoBanner({ userId, feed }: { userId: string; feed: Feed }) {
  const [status, setStatus] = useState("");
  // Why the Home notice will or won't show for this user right now.
  const candidate = feed.updates.find((update) => update.publication === "published" && update.proactive);
  const noticeState = feed.state.hideHomeNotices
    ? "Off: \"Show updates on Home\" is turned off."
    : feed.notice
      ? `Ready: "${feed.notice.title}" shows on Home.`
      : candidate && feed.state.read.includes(candidate.id)
        ? `Not showing: "${candidate.title}" has already been read.`
        : "Not showing: no important unread update.";
  return (
    <div className="luxia-explore-demo-banner mb-6 rounded-[var(--luxia-radius-12)] border px-4 py-3" role="note" data-explore-demo-banner="">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="luxia-explore-demo-icon flex size-8 shrink-0 items-center justify-center rounded-[10px]" aria-hidden>
          <FlaskConical size={16} strokeWidth={2} />
        </span>
        <p className="min-w-0 flex-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          <span className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>Concept Demo · internal build. </span>
          Items marked Concept Demo illustrate how Explore could grow. They are not releases, customer results or available features.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="tertiary"
            size="compact"
            onClick={() => {
              resetDemoNotifications(userId);
              setStatus("Demo notifications reset. Go to Home to see the update notice.");
            }}
            data-explore-demo-reset=""
          >
            <RotateCcw size={14} aria-hidden />
            Reset demo notifications
          </Button>
          <Button type="button" variant="secondary" size="compact" onClick={exitExploreConceptDemo}>Exit Concept Demo</Button>
        </div>
      </div>
      <p className="mt-1.5 pl-11 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} data-explore-demo-notice-state="">
        <span className="font-semibold" style={{ color: "var(--luxia-text-secondary)" }}>Home notice · </span>{noticeState}
      </p>
      <p className="pl-11 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} aria-live="polite" data-explore-demo-reset-status="">
        {status || "Reset marks this user's updates unread and turns \"Show updates on Home\" back on. Home layouts and the dot setting are kept."}
      </p>
    </div>
  );
}

function SectionIntro({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="luxia-explore-icon-chip" aria-hidden>{icon}</span>
        <div className="min-w-0">
          <h2 className="luxia-type-heading-h3" style={{ color: HS.sectionHeading }}>{title}</h2>
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{text}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function SubHeading({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 className="luxia-type-title-component" style={{ color: HS.sectionHeading }}>{title}</h3>
        {text ? <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ActionButton({ action, onAction, variant = "secondary" }: { action: ExploreAction; onAction: (action: ExploreAction) => void; variant?: "primary" | "secondary" | "tertiary" }) {
  if (action.kind === "url") {
    return (
      <a className={`luxia-button luxia-button--${variant} luxia-button--compact inline-flex items-center gap-1.5`} href={action.href} target="_blank" rel="noreferrer">
        {action.label}
        <ArrowRight size={14} aria-hidden />
      </a>
    );
  }
  return (
    <Button type="button" variant={variant} size="compact" onClick={() => onAction(action)}>
      {action.label}
      <ArrowRight size={14} aria-hidden />
    </Button>
  );
}

/** A real, working action: only internal routes (closed set) or a configured URL. */
function realAction(entry: ExploreEntry): ExploreAction | null {
  if (!entry.action) return null;
  if (entry.section === "products" && entry.availability !== "available") return null;
  return entry.action;
}

// Identities (conceptual marks, not Margherita's approved artwork)

const IDENTITY_ICONS: Record<ExploreIdentity["icon"], LucideIcon> = {
  credit: Wallet,
  data: Database,
  document: FileText,
  gpt: MessageSquareText,
  humanoid: Bot,
  verify: BadgeCheck,
  writing: PenLine,
  code: Code2,
  registry: ScrollText,
};

function IdentityMark({ identity, title, size = 56 }: { identity?: ExploreIdentity; title: string; size?: number }) {
  if (!identity) {
    const letters = title.split(/\s+/).filter((word) => /^[A-Za-z0-9]/.test(word)).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    return <span className="luxia-explore-monogram" style={{ width: size, height: size, borderRadius: size / 3.5 }} aria-hidden>{letters}</span>;
  }
  const Icon = IDENTITY_ICONS[identity.icon];
  return (
    <span className={`luxia-explore-identity luxia-explore-identity--${identity.hue}`} style={{ width: size, height: size }} aria-hidden>
      <Icon size={Math.round(size * 0.42)} strokeWidth={1.8} />
    </span>
  );
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  Manufacturing: Factory,
  Construction: HardHat,
  Banking: Landmark,
  "Public Administration": Building2,
  Marketing: Megaphone,
};

function IndustryChip({ industry }: { industry: string }) {
  const Icon = INDUSTRY_ICONS[industry] ?? Building2;
  return (
    <span className="luxia-explore-industry" data-industry={industry}>
      <Icon size={13} strokeWidth={2} aria-hidden />
      {industry}
    </span>
  );
}

// What's New

type UpdateFilter = "all" | ExploreUpdate["kind"];

function WhatsNewSection({ userId, feed, onOpen }: { userId: string; feed: Feed; onOpen: OpenEntry }) {
  const { updates, state } = feed;
  const [filter, setFilter] = useState<UpdateFilter>("all");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const kinds = useMemo(() => (Object.keys(EXPLORE_UPDATE_KIND_LABELS) as Array<ExploreUpdate["kind"]>).filter((kind) => updates.some((update) => update.kind === kind)), [updates]);
  const featured = filter === "all" ? updates.find((update) => update.featured) : undefined;
  const shown = updates.filter((update) => update !== featured && (filter === "all" || update.kind === filter));
  // New = not opened yet. Hiding a Home notice doesn't make an update read.
  const isNew = (update: ExploreUpdate) => !state.read.includes(update.id);
  const fresh = shown.filter(isNew);
  const months = new Map<string, ExploreUpdate[]>();
  for (const update of shown.filter((entry) => !isNew(entry))) {
    const month = exploreMonthLabel(update.date);
    months.set(month, [...(months.get(month) ?? []), update]);
  }

  return (
    <section aria-label="What's New" className="min-w-0 max-w-[920px]">
      <SectionIntro
        icon={<Megaphone size={18} strokeWidth={2} />}
        title="What's New"
        text="Product updates, release notes and Luxia news, newest first."
        action={(
          <Button
            type="button"
            variant="tertiary"
            size="compact"
            aria-expanded={prefsOpen}
            aria-controls="explore-update-preferences"
            onClick={() => setPrefsOpen((value) => !value)}
            data-explore-preferences-toggle=""
          >
            <SlidersHorizontal size={14} aria-hidden />
            Update preferences
          </Button>
        )}
      />
      {prefsOpen ? <PreferencesPanel userId={userId} state={state} /> : null}
      {featured ? (
        <EntryLink entry={featured} onOpen={onOpen} className="luxia-explore-featured-news mb-5 block rounded-[var(--luxia-radius-16)] p-6" label={`Featured: ${featured.title}`}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="luxia-explore-chip luxia-explore-chip--on-dark"><Sparkles size={11} aria-hidden />Featured</span>
            {isNew(featured) ? <NewChip /> : null}
            <span className="luxia-explore-chip luxia-explore-chip--on-dark">{EXPLORE_UPDATE_KIND_LABELS[featured.kind]}</span>
            <ConceptLabel entry={featured} />
          </span>
          <span className="mt-3 block luxia-type-heading-h3" style={{ color: "var(--luxia-text-inverse)" }}>{featured.title}</span>
          <span className="mt-1 block max-w-[60ch] luxia-type-body" style={{ color: "rgba(255,255,255,0.82)" }}>{featured.summary}</span>
          <span className="mt-3 flex items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-purple-20)" }}>
            {formatExploreDate(featured.date)} · {featured.area}
            <ArrowRight size={13} aria-hidden />
          </span>
        </EntryLink>
      ) : null}
      {kinds.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter updates">
          {(["all", ...kinds] as UpdateFilter[]).map((kind) => (
            <button key={kind} type="button" className="luxia-explore-filter" aria-pressed={filter === kind} onClick={() => setFilter(kind)} data-explore-filter={kind}>
              {kind === "all" ? "All" : EXPLORE_UPDATE_KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      ) : null}
      {shown.length === 0 && !featured ? (
        <div className="luxia-explore-empty rounded-[var(--luxia-radius-12)] border border-dashed px-6 py-10 text-center" data-explore-empty="">
          <p className="luxia-type-title-card" style={{ color: HS.sectionHeading }}>You're up to date</p>
          <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>Product updates and Luxia news will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {fresh.length > 0 ? <UpdateGroup label="New" updates={fresh} isNew={isNew} onOpen={onOpen} /> : null}
          {[...months.entries()].map(([month, entries]) => <UpdateGroup key={month} label={month} updates={entries} isNew={isNew} onOpen={onOpen} />)}
        </div>
      )}
    </section>
  );
}

function UpdateGroup({ label, updates, isNew, onOpen }: { label: string; updates: ExploreUpdate[]; isNew: (update: ExploreUpdate) => boolean; onOpen: OpenEntry }) {
  return (
    <section aria-label={label}>
      <h3 className="mb-2 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>{label}</h3>
      <ul className="luxia-explore-list overflow-hidden rounded-[var(--luxia-radius-12)] border">
        {updates.map((update) => (
          <li key={update.id}>
            <EntryLink
              entry={update}
              onOpen={onOpen}
              className="luxia-explore-row flex w-full min-w-0 items-start gap-3 px-4 py-3.5 text-left"
              label={`${update.title}${isNew(update) ? ", new" : ""}. ${update.summary}`}
            >
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isNew(update) ? "bg-[var(--luxia-purple-50)]" : ""}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <KindChip kind={update.kind} />
                  <ConceptLabel entry={update} />
                </span>
                <span className="mt-1 block luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{update.title}</span>
                <span className="block luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{update.summary}</span>
                <span className="mt-1 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{`${formatExploreDate(update.date)} · ${update.area}`}</span>
              </span>
              <ArrowRight size={15} className="mt-1 shrink-0" style={{ color: "var(--luxia-purple-50)" }} aria-hidden />
            </EntryLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Inline, compact (no overlay): opened from "Update preferences". */
function PreferencesPanel({ userId, state }: { userId: string; state: ExploreUserState }) {
  return (
    <div id="explore-update-preferences" className="luxia-explore-prefs mb-4 rounded-[var(--luxia-radius-12)] border px-4 py-3" data-explore-preferences="">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <PreferenceSwitch
          id="explore-pref-notices"
          label="Show updates on Home"
          hint="Get notified about important product updates."
          checked={!state.hideHomeNotices}
          onChange={(on) => setExplorePreference(userId, "hideHomeNotices", !on)}
        />
        <PreferenceSwitch
          id="explore-pref-dot"
          label="Show unread indicator"
          hint="Show a dot next to Explore Luxia for unread updates."
          checked={!state.hideIndicator}
          onChange={(on) => setExplorePreference(userId, "hideIndicator", !on)}
        />
      </div>
      <p className="mt-2.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        Service and security alerts are always shown. Preferences are saved in this browser.
      </p>
    </div>
  );
}

function PreferenceSwitch({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{label}</label>
        <p id={`${id}-hint`} className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-hint`} />
    </div>
  );
}

// Overview

function OverviewSection({ feed, onSectionChange, onAction, onOpen }: { feed: Feed; onSectionChange: (section: ExploreSectionId) => void; onAction: (action: ExploreAction) => void; onOpen: OpenEntry }) {
  const products = only<ExploreProduct>(feed.entries, "products");
  const featured = products.find((product) => product.featured);
  const agents = products.filter((product) => product.agent);
  const has = (id: ExploreSectionId) => feed.sections.includes(id);
  const seeAll = (id: ExploreSectionId) => (
    <Button type="button" variant="tertiary" size="compact" onClick={() => onSectionChange(id)} data-explore-see-all={id}>
      {`See all ${EXPLORE_SECTION_LABELS[id]}`}
      <ArrowRight size={14} aria-hidden />
    </Button>
  );
  const unread = new Set(feed.unread.map((update) => update.id));
  return (
    <div className="space-y-10" data-explore-overview="">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {featured ? (
          <EntryLink entry={featured} onOpen={onOpen} className="luxia-explore-featured flex min-w-0 flex-col rounded-[var(--luxia-radius-16)] p-6" label={`Featured: ${featured.title}`}>
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="luxia-explore-chip luxia-explore-chip--on-dark"><Sparkles size={11} aria-hidden />Featured</span>
              <AvailabilityBadge availability={featured.availability} />
              <ConceptLabel entry={featured} />
            </span>
            <span className="mt-5 flex items-center gap-4">
              <IdentityMark identity={featured.identity} title={featured.title} size={64} />
              <span className="min-w-0">
                <span className="block luxia-type-overline-data" style={{ color: "var(--luxia-purple-20)" }}>{featured.category}</span>
                <span className="block luxia-type-heading-h2" style={{ color: "var(--luxia-text-inverse)" }}>{featured.title}</span>
              </span>
            </span>
            <span className="mt-3 block max-w-[52ch] luxia-type-body" style={{ color: "rgba(255,255,255,0.82)" }}>{featured.summary}</span>
            <span className="mt-auto flex items-center gap-1.5 pt-6 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-20)" }}>
              View details <ArrowRight size={14} aria-hidden />
            </span>
          </EntryLink>
        ) : null}
        <section aria-label="Latest updates" className="luxia-explore-card min-w-0 rounded-[var(--luxia-radius-16)] border p-5">
          <SubHeading title="Latest updates" action={seeAll("whats-new")} />
          <ul className="divide-y" style={{ borderColor: "var(--luxia-border-default)" }}>
            {feed.updates.slice(0, 3).map((update) => (
              <li key={update.id} className="py-2.5">
                <EntryLink entry={update} onOpen={onOpen} className="luxia-explore-link-row block w-full rounded-[8px] text-left">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {unread.has(update.id) ? <NewChip /> : null}
                    <KindChip kind={update.kind} />
                    <ConceptLabel entry={update} />
                  </span>
                  <span className="mt-1 block luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{update.title}</span>
                  <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{formatExploreDate(update.date)}</span>
                </EntryLink>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {has("products") && agents.length > 0 ? (
        <div>
          <SectionIntro icon={<Compass size={18} strokeWidth={2} />} title="Agent Gallery" text="Agents and what each one is for. Availability is always shown first." action={seeAll("products")} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {agents.slice(0, 4).map((agent) => <AgentCard key={agent.id} agent={agent} onOpen={onOpen} onAction={onAction} />)}
          </div>
        </div>
      ) : null}

      {has("ideas") ? (
        <div>
          <SectionIntro icon={<Lightbulb size={18} strokeWidth={2} />} title="Ideas for internal flows" text="Examples of what teams could do with Luxia." action={seeAll("ideas")} />
          <ul className="luxia-explore-scroll-row -mx-1 flex gap-3 overflow-x-auto px-1 pb-2" aria-label="Ideas">
            {only<ExploreIdea>(feed.entries, "ideas").slice(0, 6).map((idea) => (
              <li key={idea.id} className="w-[280px] shrink-0">
                <IdeaCard idea={idea} entries={feed.entries} onOpen={onOpen} compact />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {has("learn") ? (
          <OverviewColumn icon={<BookOpen size={16} strokeWidth={2} />} title="Learn" action={seeAll("learn")}>
            {only<ExploreLearnItem>(feed.entries, "learn").slice(0, 2).map((item) => <MiniCard key={item.id} entry={item} eyebrow={item.format} onOpen={onOpen} />)}
          </OverviewColumn>
        ) : null}
        {has("stories") ? (
          <OverviewColumn icon={<Megaphone size={16} strokeWidth={2} />} title="Customer Stories" action={seeAll("stories")}>
            {only<ExploreStory>(feed.entries, "stories").slice(0, 2).map((story) => <MiniCard key={story.id} entry={story} eyebrow={story.industry} onOpen={onOpen} />)}
          </OverviewColumn>
        ) : null}
      </div>

      {has("services") ? (
        <div className="luxia-explore-band flex flex-wrap items-center justify-between gap-4 rounded-[var(--luxia-radius-16)] border px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="luxia-explore-icon-chip" aria-hidden><Handshake size={18} strokeWidth={2} /></span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 luxia-type-title-component" style={{ color: HS.sectionHeading }}>
                Work with Luxia's team
                {only<ExploreService>(feed.entries, "services").some((service) => service.publication === "concept") ? <ConceptDemoChip /> : null}
              </p>
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>Propose a process you have in mind, or get a guided analysis of where AI could help.</p>
            </div>
          </div>
          {seeAll("services")}
        </div>
      ) : null}

      {feed.conceptDemo ? <ConceptMap /> : null}
    </div>
  );
}

function OverviewColumn({ icon, title, action, children }: { icon: ReactNode; title: string; action: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="luxia-explore-card flex min-w-0 flex-col rounded-[var(--luxia-radius-16)] border p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="luxia-explore-icon-chip luxia-explore-icon-chip--sm" aria-hidden>{icon}</span>
        <h3 className="luxia-type-title-component" style={{ color: HS.sectionHeading }}>{title}</h3>
      </div>
      <div className="space-y-2.5">{children}</div>
      <div className="mt-auto pt-3">{action}</div>
    </section>
  );
}

function MiniCard({ entry, eyebrow, onOpen }: { entry: ExploreEntry; eyebrow: string; onOpen: OpenEntry }) {
  return (
    <EntryLink entry={entry} onOpen={onOpen} className="luxia-explore-mini block rounded-[10px] px-3 py-2.5">
      <span className="flex flex-wrap items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        {eyebrow}
        <ConceptLabel entry={entry} />
      </span>
      <span className="mt-0.5 block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{entry.title}</span>
      <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{entry.summary}</span>
    </EntryLink>
  );
}

function ConceptMap() {
  const rows = getConceptMap();
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="explore-concept-map" className="luxia-explore-card rounded-[var(--luxia-radius-16)] border p-5" data-explore-concept-map="">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="luxia-explore-icon-chip luxia-explore-icon-chip--sm" aria-hidden><MapIcon size={16} strokeWidth={2} /></span>
        <h3 id="explore-concept-map" className="luxia-type-title-component" style={{ color: HS.sectionHeading }}>Where each idea lives</h3>
        <ConceptDemoChip />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left luxia-type-body-dense">
          <thead>
            <tr style={{ color: "var(--luxia-text-muted)" }}>
              {["Idea", "Home", "Explore Luxia", "Elsewhere"].map((head) => <th key={head} scope="col" className="border-b px-2 py-2 luxia-type-overline-data" style={{ borderColor: "var(--luxia-border-default)" }}>{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.idea} className="align-top">
                <th scope="row" className="border-b px-2 py-2 luxia-type-body-dense-strong" style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-primary)" }}>{row.idea}</th>
                {[row.home, row.explore, row.elsewhere].map((cell, index) => (
                  <td key={index} className="border-b px-2 py-2" style={{ borderColor: "var(--luxia-border-default)", color: "var(--luxia-text-secondary)" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Products & Agents

const AVAILABILITY_GROUPS: Array<{ availability: ExploreAvailability; title: string; text: string }> = [
  { availability: "available", title: "Available in your workspace", text: "Ready to use today." },
  { availability: "on-request", title: "Available on request", text: "Set up together with your team." },
  { availability: "coming-soon", title: "Coming soon", text: "Not available yet." },
];

function ProductsSection({ products, conceptDemo, onAction, onOpen }: { products: ExploreProduct[]; conceptDemo: boolean; onAction: (action: ExploreAction) => void; onOpen: OpenEntry }) {
  const agents = products.filter((product) => product.agent);
  const others = products.filter((product) => !product.agent);
  return (
    <div className="space-y-9">
      <SectionIntro icon={<Compass size={18} strokeWidth={2} />} title="Products & Agents" text="Every entry states its availability first. Only features available in your workspace can be opened." />
      {agents.length > 0 ? (
        <section aria-label="Agent Gallery" data-explore-agent-gallery="">
          <SubHeading
            title="Agent Gallery"
            text={conceptDemo ? "Seven agent concepts. Identities are conceptual visuals, not final artwork." : undefined}
          />
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {agents.map((agent) => <li key={agent.id} className="min-w-0"><AgentCard agent={agent} onOpen={onOpen} onAction={onAction} /></li>)}
            {conceptDemo ? (
              <li className="min-w-0">
                <div className="luxia-explore-create-card flex h-full min-h-[212px] flex-col rounded-[var(--luxia-radius-16)] border border-dashed p-5" data-explore-create-agent="">
                  <span className="flex size-14 items-center justify-center rounded-full" style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-60)" }} aria-hidden>
                    <Plus size={22} strokeWidth={2} />
                  </span>
                  <p className="mt-4 luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>Create your own agent</p>
                  <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    Not available yet: there is no creation flow in Luxia today. Describe what you need and Luxia's team will look at it with you.
                  </p>
                  <span className="mt-2"><ConceptDemoChip /></span>
                </div>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
      {AVAILABILITY_GROUPS.map((group) => {
        const entries = others.filter((product) => product.availability === group.availability);
        if (entries.length === 0) return null;
        return (
          <section key={group.availability} aria-label={group.title}>
            <SubHeading title={agents.length > 0 ? `${group.title} · platform and tools` : group.title} text={group.text} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((product) => <ProductCard key={product.id} product={product} onAction={onAction} onOpen={onOpen} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Agent card: identity, name, role and availability. Hover and keyboard focus
 * reveal the description and "View details" without moving the layout; on
 * touch screens the description is always visible.
 */
function AgentCard({ agent, onOpen, onAction }: { agent: ExploreProduct; onOpen: OpenEntry; onAction: (action: ExploreAction) => void }) {
  const action = realAction(agent);
  return (
    <article className="luxia-explore-agent group relative flex h-full min-h-[212px] min-w-0 flex-col rounded-[var(--luxia-radius-16)] border p-5" data-explore-agent={agent.id}>
      <EntryLink entry={agent} onOpen={onOpen} className="luxia-explore-agent-link absolute inset-0 rounded-[var(--luxia-radius-16)]" label={`${agent.title}, ${agent.role ?? agent.category}. View details`}>
        <span className="sr-only">View details</span>
      </EntryLink>
      <div className="pointer-events-none relative flex items-start justify-between gap-2">
        <IdentityMark identity={agent.identity} title={agent.title} />
        <AvailabilityBadge availability={agent.availability} />
      </div>
      <h4 className="pointer-events-none relative mt-4 luxia-type-title-component" style={{ color: "var(--luxia-text-primary)" }}>{agent.title}</h4>
      <p className="pointer-events-none relative luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{agent.role}</p>
      <p className="luxia-explore-agent-reveal pointer-events-none relative mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{agent.summary}</p>
      <div className="relative mt-auto flex flex-wrap items-center gap-2 pt-3">
        <ConceptLabel entry={agent} />
        <span className="luxia-explore-agent-cue pointer-events-none ml-auto inline-flex items-center gap-1 luxia-type-caption font-semibold" style={{ color: "var(--luxia-purple-70)" }}>
          View details <ArrowRight size={12} aria-hidden />
        </span>
      </div>
      {action ? <div className="relative z-[1] mt-3"><ActionButton action={action} onAction={onAction} /></div> : null}
    </article>
  );
}

function ProductCard({ product, onAction, onOpen }: { product: ExploreProduct; onAction: (action: ExploreAction) => void; onOpen: OpenEntry }) {
  const action = realAction(product);
  return (
    <article className="luxia-explore-card flex min-w-0 flex-col rounded-[var(--luxia-radius-12)] border p-4" aria-label={product.title} data-explore-product={product.id}>
      <div className="flex items-start gap-3">
        <IdentityMark identity={product.identity} title={product.title} size={40} />
        <div className="min-w-0 flex-1">
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{product.category}</p>
          <h4 className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{product.title}</h4>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <AvailabilityBadge availability={product.availability} />
        <ConceptLabel entry={product} />
      </div>
      <p className="mt-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{product.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        {action ? <ActionButton action={action} onAction={onAction} /> : null}
        <EntryLink entry={product} onOpen={onOpen} className="luxia-explore-text-link" label={`View details: ${product.title}`}>View details</EntryLink>
      </div>
    </article>
  );
}

// Learn

const LEARN_TRACKS: Array<{ track: ExploreLearnItem["track"]; title: string }> = [
  { track: "getting-started", title: "Getting started" },
  { track: "guides", title: "Product guides" },
  { track: "lia", title: "LIA / HIS training" },
  { track: "tutorials", title: "Tutorials" },
];

function LearnSection({ items, onOpen }: { items: ExploreLearnItem[]; onOpen: OpenEntry }) {
  return (
    <div>
      <SectionIntro icon={<BookOpen size={18} strokeWidth={2} />} title="Learn" text="Guides and tutorials for getting more from Luxia." />
      <div className="grid gap-4 md:grid-cols-2">
        {LEARN_TRACKS.map(({ track, title }) => {
          const entries = items.filter((item) => item.track === track);
          if (entries.length === 0) return null;
          return (
            <section key={track} aria-label={title} className="luxia-explore-card rounded-[var(--luxia-radius-12)] border p-4">
              <h3 className="mb-2 luxia-type-title-component" style={{ color: HS.sectionHeading }}>{title}</h3>
              <div className="space-y-2.5">
                {entries.map((item) => <MiniCard key={item.id} entry={item} eyebrow={item.format} onOpen={onOpen} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Ideas

function IdeasSection({ ideas, entries, onOpen }: { ideas: ExploreIdea[]; entries: readonly ExploreEntry[]; onOpen: OpenEntry }) {
  const categories = [...new Set(ideas.map((idea) => idea.area))];
  const [category, setCategory] = useState<string>("all");
  const shown = ideas.filter((idea) => category === "all" || idea.area === category);
  return (
    <div>
      <SectionIntro icon={<Lightbulb size={18} strokeWidth={2} />} title="Ideas for internal flows" text="Examples of what organisations could do with Luxia. Ideas are inspiration, not ready-made automations." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter ideas by category">
        {["all", ...categories].map((value) => (
          <button key={value} type="button" className="luxia-explore-filter" aria-pressed={category === value} onClick={() => setCategory(value)} data-explore-idea-filter={value}>
            {value === "all" ? "All" : value}
          </button>
        ))}
      </div>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Ideas">
        {shown.map((idea) => <li key={idea.id} className="min-w-0"><IdeaCard idea={idea} entries={entries} onOpen={onOpen} /></li>)}
      </ul>
    </div>
  );
}

function IdeaCard({ idea, entries, onOpen, compact = false }: { idea: ExploreIdea; entries: readonly ExploreEntry[]; onOpen: OpenEntry; compact?: boolean }) {
  const agents = idea.agents.map((id) => entries.find((entry) => entry.id === id)).filter(Boolean) as ExploreEntry[];
  return (
    <EntryLink entry={idea} onOpen={onOpen} className="luxia-explore-card luxia-explore-hover-card flex h-full min-w-0 flex-col rounded-[var(--luxia-radius-12)] border p-4">
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="luxia-explore-chip">{idea.area}</span>
        <ConceptLabel entry={idea} />
      </span>
      <span className="mt-2 block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{idea.title}</span>
      <span className={`block luxia-type-caption ${compact ? "line-clamp-2" : "line-clamp-3"}`} style={{ color: "var(--luxia-text-secondary)" }}>{idea.problem}</span>
      {agents.length > 0 ? (
        <span className="mt-auto flex flex-wrap gap-1 pt-3">
          {agents.map((agent) => <span key={agent.id} className="luxia-explore-agent-chip">{agent.title}</span>)}
        </span>
      ) : null}
    </EntryLink>
  );
}

// Customer Stories

function StoriesSection({ stories, onOpen }: { stories: ExploreStory[]; onOpen: OpenEntry }) {
  return (
    <div>
      <SectionIntro icon={<Megaphone size={18} strokeWidth={2} />} title="Customer Stories" text="Approved case studies only. Every result is verified with the customer." />
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Customer Stories">
        {stories.map((story) => (
          <li key={story.id} className="min-w-0">
            <EntryLink entry={story} onOpen={onOpen} className="luxia-explore-card luxia-explore-hover-card flex h-full min-w-0 flex-col rounded-[var(--luxia-radius-16)] border p-5">
              <span className="flex flex-wrap items-center gap-1.5">
                <IndustryChip industry={story.industry} />
                <ConceptLabel entry={story} />
              </span>
              <span className="mt-3 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{story.customer}</span>
              <span className="block luxia-type-title-component" style={{ color: HS.sectionHeading }}>{story.title}</span>
              <span className="mt-1.5 block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{story.summary}</span>
              <span className="mt-auto flex items-center gap-1 pt-3 luxia-type-caption font-semibold" style={{ color: "var(--luxia-purple-70)" }}>
                Read the story <ArrowRight size={12} aria-hidden />
              </span>
            </EntryLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Services

function ServicesSection({ services, onOpen }: { services: ExploreService[]; onOpen: OpenEntry }) {
  const journeys = services.filter((service) => service.id === "propose-a-process" || service.id === "business-analysis");
  const others = services.filter((service) => !journeys.includes(service));
  return (
    <div className="space-y-6">
      <SectionIntro icon={<Handshake size={18} strokeWidth={2} />} title="Services" text="Work with Luxia's team, whether you already have a process in mind or want guidance." />
      {journeys.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Consultation journeys">
          {journeys.map((service, index) => (
            <li key={service.id} className="min-w-0">
              <EntryLink entry={service} onOpen={onOpen} className="luxia-explore-journey luxia-explore-hover-card flex h-full min-w-0 flex-col rounded-[var(--luxia-radius-16)] border p-6">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="luxia-explore-chip">{`Path ${index === 0 ? "A" : "B"}`}</span>
                  <ConceptLabel entry={service} />
                </span>
                <span className="mt-3 block luxia-type-heading-h3" style={{ color: HS.sectionHeading }}>{service.title}</span>
                {service.forWho ? <span className="mt-0.5 block luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{service.forWho}</span> : null}
                <span className="mt-2 block luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{service.summary}</span>
                <span className="mt-auto flex items-center gap-1 pt-4 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
                  {index === 0 ? "Describe your process" : "See how it works"} <ArrowRight size={14} aria-hidden />
                </span>
              </EntryLink>
            </li>
          ))}
        </ul>
      ) : null}
      {others.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {others.map((service) => <MiniCard key={service.id} entry={service} eyebrow="Service" onOpen={onOpen} />)}
        </div>
      ) : null}
    </div>
  );
}

// Full-page entry (shared template for every section)

const SECTION_ICONS: Record<ExploreContentSectionId, LucideIcon> = {
  "whats-new": Megaphone,
  products: Compass,
  learn: BookOpen,
  ideas: Lightbulb,
  stories: Megaphone,
  services: Handshake,
};

/**
 * One entry as a full page in Explore Luxia: back link, metadata chips, title
 * (focused on arrival), lead, typed blocks, an aside with facts and only real
 * actions, and related entries. Opening an update marks it read.
 */
function EntryPage({
  userId,
  feed,
  section,
  entry,
  returnTo,
  onBack,
  onOpen,
  onAction,
}: {
  userId: string;
  feed: Feed;
  section: ExploreContentSectionId;
  entry: ExploreEntry | undefined;
  returnTo: ExploreReturnTo;
  onBack: () => void;
  onOpen: OpenEntry;
  onAction: (action: ExploreAction) => void;
}) {
  useEffect(() => {
    if (entry) markExploreEntryRead(userId, entry);
  }, [entry, userId]);
  useEffect(() => {
    document.getElementById("explore-entry-title")?.focus({ preventScroll: true });
  }, [entry?.id]);

  const backLabel = returnTo === "home" ? "Back to Home" : `Back to ${EXPLORE_SECTION_LABELS[returnTo]}`;
  const back = (
    <Button type="button" variant="tertiary" size="compact" onClick={onBack} className="-ml-2" data-explore-back="">
      <ArrowLeft size={14} aria-hidden />
      {backLabel}
    </Button>
  );

  if (!entry) {
    return (
      <div className="max-w-[720px]" data-explore-entry-page="missing" data-explore-update-page="missing">
        {back}
        <div className="luxia-explore-empty mt-4 rounded-[var(--luxia-radius-12)] border border-dashed px-6 py-10 text-center">
          <p className="luxia-type-title-card" style={{ color: HS.sectionHeading }}>This page isn't available</p>
          <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{`It may have moved or been removed. Everything current is in ${EXPLORE_SECTION_LABELS[section]}.`}</p>
        </div>
      </div>
    );
  }

  const Icon = SECTION_ICONS[section];
  const related = (entry.related ?? []).map((id) => feed.entries.find((candidate) => candidate.id === id)).filter(Boolean) as ExploreEntry[];
  const fallbackRelated = section === "whats-new" ? feed.updates.filter((update) => update.id !== entry.id).slice(0, 3) : [];
  const action = realAction(entry);
  const blocks: ExploreBlock[] = entry.blocks ?? (entry.section === "whats-new" ? [{ type: "paragraphs", items: entry.body }] : []);

  return (
    <div className="min-w-0" data-explore-entry-page={entry.id} {...(entry.section === "whats-new" ? { "data-explore-update-page": entry.id } : {})}>
      {back}
      <div className="mt-4 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 max-w-[760px]" aria-labelledby="explore-entry-title">
          <header className="flex min-w-0 items-start gap-4">
            {entry.section === "products" ? <IdentityMark identity={entry.identity} title={entry.title} size={64} /> : (
              <span className="luxia-explore-icon-chip mt-1" aria-hidden><Icon size={18} strokeWidth={2} /></span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <EntryChips entry={entry} />
                <ConceptLabel entry={entry} />
              </div>
              <h2 id="explore-entry-title" className="explore-entry-title mt-2 luxia-type-heading-h2" style={{ color: HS.sectionHeading }} tabIndex={-1}>
                {entry.title}
              </h2>
              <EntryMeta entry={entry} />
            </div>
          </header>
          <p className="mt-5 max-w-[68ch] luxia-type-body-large" style={{ color: "var(--luxia-text-primary)" }}>{entry.summary}</p>
          <EntryTypeBody entry={entry} feed={feed} onOpen={onOpen} />
          <div className="mt-6 space-y-7">
            {blocks.map((block, index) => <Block key={`${block.type}-${index}`} block={block} />)}
          </div>
          {action ? <div className="mt-7 xl:hidden"><ActionButton action={action} onAction={onAction} variant="primary" /></div> : null}
        </article>
        <aside className="min-w-0 space-y-4 xl:pt-1" aria-label="About this page">
          <FactsCard entry={entry} action={action} onAction={onAction} onOpen={onOpen} feed={feed} />
          {[...related, ...fallbackRelated].length > 0 ? (
            <section aria-label="Related" className="luxia-explore-card rounded-[var(--luxia-radius-12)] border p-4" data-explore-related="">
              <h3 className="mb-2 luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>{section === "whats-new" && related.length === 0 ? "More updates" : "Related"}</h3>
              <ul className="space-y-1">
                {[...related, ...fallbackRelated].slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <EntryLink entry={item} onOpen={onOpen} className="luxia-explore-link-row block rounded-[8px] px-2 py-2">
                      <span className="flex flex-wrap items-center gap-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                        {EXPLORE_SECTION_LABELS[item.section]}
                        <ConceptLabel entry={item} />
                      </span>
                      <span className="mt-0.5 block luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{item.title}</span>
                    </EntryLink>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function EntryChips({ entry }: { entry: ExploreEntry }) {
  switch (entry.section) {
    case "whats-new": return <KindChip kind={entry.kind} />;
    case "products": return <><span className="luxia-explore-chip">{entry.category}</span><AvailabilityBadge availability={entry.availability} /></>;
    case "learn": return <span className="luxia-explore-chip">{entry.format}</span>;
    case "ideas": return <span className="luxia-explore-chip">{entry.area}</span>;
    case "stories": return <IndustryChip industry={entry.industry} />;
    case "services": return <span className="luxia-explore-chip">Service</span>;
  }
}

function EntryMeta({ entry }: { entry: ExploreEntry }) {
  const text = entry.section === "whats-new"
    ? null
    : entry.section === "products" ? entry.role
      : entry.section === "stories" ? entry.customer
        : entry.section === "services" ? entry.forWho
          : null;
  if (entry.section === "whats-new") {
    return (
      <p className="mt-1.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
        <time dateTime={entry.date}>{formatExploreDate(entry.date)}</time>{` · ${entry.area}`}
      </p>
    );
  }
  return text ? <p className="mt-1.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>{text}</p> : null;
}

/** Section-specific body parts that come from fields rather than blocks (ideas, stories). */
function EntryTypeBody({ entry, feed, onOpen }: { entry: ExploreEntry; feed: Feed; onOpen: OpenEntry }) {
  if (entry.section === "ideas") {
    const agents = entry.agents.map((id) => feed.entries.find((candidate) => candidate.id === id)).filter(Boolean) as ExploreEntry[];
    const service = feed.entries.find((candidate) => candidate.id === "propose-a-process");
    return (
      <div className="mt-6 space-y-7">
        <Block block={{ type: "paragraphs", title: "The problem", items: [entry.problem] }} />
        <Block block={{ type: "steps", title: "How it could work", items: entry.steps.map((step, index) => ({ title: `Step ${index + 1}`, text: step })) }} />
        {agents.length > 0 ? (
          <section>
            <h3 className="mb-2 luxia-type-title-component" style={{ color: HS.sectionHeading }}>Related agents</h3>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => (
                <EntryLink key={agent.id} entry={agent} onOpen={onOpen} className="luxia-explore-agent-chip luxia-explore-agent-chip--link">{agent.title}</EntryLink>
              ))}
            </div>
          </section>
        ) : null}
        {service ? (
          <div className="luxia-explore-band flex flex-wrap items-center justify-between gap-3 rounded-[var(--luxia-radius-12)] border px-5 py-4" data-explore-next-step="">
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>Have a process like this?</p>
            <EntryLink entry={service} onOpen={onOpen} className="luxia-button luxia-button--primary luxia-button--compact inline-flex items-center gap-1.5">
              Let's make it together <ArrowRight size={14} aria-hidden />
            </EntryLink>
          </div>
        ) : null}
      </div>
    );
  }
  if (entry.section === "stories") {
    const capabilities = (entry.capabilities ?? []).map((id) => feed.entries.find((candidate) => candidate.id === id)).filter(Boolean) as ExploreEntry[];
    return (
      <div className="mt-6 space-y-6">
        <Block block={{ type: "paragraphs", title: "Challenge", items: [entry.challenge] }} />
        {entry.approach ? <Block block={{ type: "paragraphs", title: "Approach", items: [entry.approach] }} /> : null}
        <Block block={{ type: "paragraphs", title: "Value", items: [entry.value] }} />
        {capabilities.length > 0 ? (
          <section>
            <h3 className="mb-2 luxia-type-title-component" style={{ color: HS.sectionHeading }}>Related capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <EntryLink key={capability.id} entry={capability} onOpen={onOpen} className="luxia-explore-agent-chip luxia-explore-agent-chip--link">{capability.title}</EntryLink>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }
  return null;
}

function FactsCard({ entry, action, onAction, onOpen, feed }: { entry: ExploreEntry; action: ExploreAction | null; onAction: (action: ExploreAction) => void; onOpen: OpenEntry; feed: Feed }) {
  const facts: Array<{ label: string; value: ReactNode }> = [];
  if (entry.section === "products") {
    facts.push({ label: "Availability", value: <AvailabilityBadge availability={entry.availability} /> }, { label: "Category", value: entry.category });
  } else if (entry.section === "whats-new") {
    facts.push({ label: "Published", value: formatExploreDate(entry.date) }, { label: "Area", value: entry.area });
  } else if (entry.section === "ideas") {
    facts.push({ label: "Category", value: entry.area }, { label: "Type", value: "Example workflow" });
  } else if (entry.section === "stories") {
    facts.push({ label: "Industry", value: entry.industry });
  } else if (entry.section === "learn") {
    facts.push({ label: "Format", value: entry.format });
  }
  const isService = entry.section === "services";
  const isOnRequest = entry.section === "products" && entry.availability === "on-request";
  const storyService = entry.section === "stories" ? feed.entries.find((candidate) => candidate.id === "business-analysis") : undefined;
  return (
    <section aria-label="Details" className="luxia-explore-card rounded-[var(--luxia-radius-12)] border p-4" data-explore-facts="">
      {facts.length > 0 ? (
        <dl className="space-y-2.5">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center justify-between gap-3">
              <dt className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{fact.label}</dt>
              <dd className="luxia-type-body-dense-strong text-right" style={{ color: "var(--luxia-text-primary)" }}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {action ? <div className={`${facts.length > 0 ? "mt-4" : ""} max-xl:hidden`}><ActionButton action={action} onAction={onAction} variant="primary" /></div> : null}
      {storyService ? (
        <div className="mt-4">
          <EntryLink entry={storyService} onOpen={onOpen} className="luxia-explore-text-link">{`Explore: ${storyService.title}`}</EntryLink>
        </div>
      ) : null}
      {isService || isOnRequest ? (
        <p className={`${facts.length > 0 || action ? "mt-4 border-t pt-3" : ""} luxia-type-caption`} style={{ color: "var(--luxia-text-muted)", borderColor: "var(--luxia-border-default)" }} data-explore-contact-note="">
          {isService ? "Booking and contact destination to be confirmed. Nothing can be submitted yet." : "Contact destination to be confirmed."}
        </p>
      ) : null}
    </section>
  );
}

// Blocks

function BlockTitle({ title, label }: { title?: string; label?: string }) {
  if (!title && !label) return null;
  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-2">
      {title ? <h3 className="luxia-type-title-component" style={{ color: HS.sectionHeading }}>{title}</h3> : null}
      {label ? <span className="luxia-explore-chip luxia-explore-chip--illustrative">{label}</span> : null}
    </div>
  );
}

function Block({ block }: { block: ExploreBlock }) {
  switch (block.type) {
    case "paragraphs":
      return (
        <section className="max-w-[68ch]">
          <BlockTitle title={block.title} />
          <div className="space-y-3">{block.items.map((item) => <p key={item} className="luxia-type-body" style={{ color: "var(--luxia-text-primary)" }}>{item}</p>)}</div>
        </section>
      );
    case "list":
      return (
        <section className="max-w-[68ch]">
          <BlockTitle title={block.title} />
          <ul className="space-y-1.5">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2 luxia-type-body" style={{ color: "var(--luxia-text-primary)" }}>
                <ShieldCheck size={16} className="mt-1 shrink-0" style={{ color: "var(--luxia-purple-50)" }} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
    case "steps":
      return (
        <section>
          <BlockTitle title={block.title} />
          <ol className="grid gap-3 sm:grid-cols-2">
            {block.items.map((item, index) => (
              <li key={item.title} className="luxia-explore-card flex gap-3 rounded-[var(--luxia-radius-12)] border p-4">
                <span className="luxia-explore-step" aria-hidden>{index + 1}</span>
                <span className="min-w-0">
                  <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{item.title}</span>
                  <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{item.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      );
    case "faq":
      return (
        <section className="max-w-[68ch]">
          <BlockTitle title={block.title} />
          <div className="luxia-explore-list overflow-hidden rounded-[var(--luxia-radius-12)] border">
            {block.items.map((item) => (
              <details key={item.q} className="luxia-explore-faq group px-4 py-3">
                <summary className="cursor-pointer luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{item.q}</summary>
                <p className="mt-1.5 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "facts":
      return (
        <section>
          <BlockTitle title={block.title} />
          <dl className="grid gap-2 sm:grid-cols-2">
            {block.items.map((item) => (
              <div key={item.label} className="luxia-explore-mini rounded-[10px] px-3 py-2">
                <dt className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{item.label}</dt>
                <dd className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "example":
      return (
        <section data-explore-block="example">
          <BlockTitle title={block.title} label={block.label} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <ExampleColumn title="Inputs" items={block.inputs} />
            <span className="hidden items-center justify-center sm:flex" style={{ color: "var(--luxia-purple-50)" }} aria-hidden><ArrowRight size={18} /></span>
            <ExampleColumn title="Outputs" items={block.outputs} />
          </div>
        </section>
      );
    case "dossier":
      return (
        <section data-explore-block="dossier">
          <BlockTitle title={block.title} label={block.label} />
          <div className="luxia-explore-dossier rounded-[var(--luxia-radius-12)] border p-5">
            <p className="flex items-center gap-2 luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
              <FileText size={16} aria-hidden /> {block.heading}
            </p>
            <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {block.fields.map((field) => (
                <div key={field.label} className="flex justify-between gap-3 border-b pb-1.5" style={{ borderColor: "var(--luxia-border-default)" }}>
                  <dt className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{field.label}</dt>
                  <dd className="luxia-type-body-dense text-right" style={{ color: "var(--luxia-text-primary)" }}>{field.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{block.note}</p>
          </div>
        </section>
      );
    case "conversation":
      return (
        <section data-explore-block="conversation">
          <BlockTitle title={block.title} label={block.label} />
          <div className="luxia-explore-chat space-y-2.5 rounded-[var(--luxia-radius-12)] border p-4" role="group" aria-label={`${block.title} (${block.label})`}>
            {block.turns.map((turn, index) => (
              <p key={index} className={`luxia-explore-bubble luxia-explore-bubble--${turn.from} luxia-type-body-dense`}>
                <span className="sr-only">{turn.from === "user" ? "User: " : "Agent: "}</span>
                {turn.text}
              </p>
            ))}
          </div>
        </section>
      );
    case "code":
      return (
        <section data-explore-block="code">
          <BlockTitle title={block.title} label={block.label} />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <pre className="luxia-explore-code overflow-x-auto rounded-[var(--luxia-radius-12)] p-4" aria-label={`Example ${block.language} code`}><code>{block.code}</code></pre>
            <div className="luxia-explore-card flex flex-col rounded-[var(--luxia-radius-12)] border p-4" aria-label="Agent preview">
              <p className="luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>Agent preview</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="luxia-explore-identity luxia-explore-identity--indigo" style={{ width: 40, height: 40 }} aria-hidden><Bot size={18} /></span>
                <div className="min-w-0">
                  <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>{block.preview.name}</p>
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{block.preview.role}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {block.preview.capabilities.map((capability) => (
                  <li key={capability} className="flex items-center gap-2 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    <span className="size-1.5 rounded-full" style={{ background: "var(--luxia-purple-50)" }} aria-hidden />
                    {capability}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>Static preview. No code runs and no agent is created.</p>
            </div>
          </div>
        </section>
      );
    case "compare":
      return (
        <section>
          <BlockTitle title={block.title} label={block.label} />
          <div className="grid gap-3 sm:grid-cols-2">
            {block.columns.map((column) => (
              <div key={column.title} className="luxia-explore-card rounded-[var(--luxia-radius-12)] border p-4">
                <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{column.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {column.items.map((item) => <li key={item} className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    case "proposal":
      return <ProposalBlock block={block} />;
  }
}

function ExampleColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="luxia-explore-card rounded-[var(--luxia-radius-12)] border p-4">
      <p className="luxia-type-overline-data" style={{ color: "var(--luxia-text-muted)" }}>{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => <li key={item} className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>{item}</li>)}
      </ul>
    </div>
  );
}

/** Path A input: write a description locally (Concept Demo). Nothing is sent anywhere; copying is the only action. */
function ProposalBlock({ block }: { block: Extract<ExploreBlock, { type: "proposal" }> }) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  return (
    <section data-explore-block="proposal">
      <BlockTitle title={block.title} label={block.label} />
      <div className="luxia-explore-card rounded-[var(--luxia-radius-12)] border p-4">
        <label htmlFor="explore-proposal" className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>What happens today?</label>
        <textarea
          id="explore-proposal"
          className="luxia-explore-textarea mt-2 w-full rounded-[10px] border px-3 py-2.5 luxia-type-body-dense"
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Describe the process, who is involved and where the information comes from."
        />
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Example starts">
          {block.prompts.map((prompt) => (
            <button key={prompt} type="button" className="luxia-explore-filter" onClick={() => setText(prompt)}>{prompt}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--luxia-border-default)" }}>
          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>No submission destination is configured, so nothing is sent.</p>
          <Button
            type="button"
            variant="secondary"
            size="compact"
            disabled={!text.trim()}
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false));
            }}
          >
            <Copy size={14} aria-hidden />
            {copied ? "Copied" : "Copy description"}
          </Button>
        </div>
      </div>
    </section>
  );
}
