import { History } from "lucide-react";
import { LuxiaArrowRightIcon } from "@/assets/icons";
import { Button } from "@/app/components/ui/button";
import { ChangePrimaryDialog } from "./ChangePrimaryDialog";
import {
  buildContinueFocusMenuItems,
  HomeContinueMenu,
} from "./HomeContinueMenu";
import type { HomeEntityKey } from "./homeEntityKeys";
import { EntityIcon, toEntityType } from "./entityIdentity";
import {
  getHomeCardStyle,
  getProjectCardTypography,
  getSourceAccentColor,
  HI,
  HS,
} from "./homeSurfaces";
import { PinButton } from "./PinButton";
import { SectionHeader } from "./SectionHeader";
import type { HomeHeroContent, HomeProjectCard, HomeRecentWorkItem, HomeShortcutEntityType } from "./types";
import { useMemo, useState } from "react";

interface HeroContextFields {
  project: string;
  constellation?: string;
  sourceTag?: {
    label: "DB" | "CSV" | "PDF";
    color: string;
    background: string;
  };
}

function getHeroContextFields(hero: HomeHeroContent): HeroContextFields | null {
  if (hero.kind !== "galaxySession" && hero.kind !== "chat") return null;

  const fields: HeroContextFields = {
    project: hero.projectName ?? hero.context,
  };

  if (hero.constellationName) {
    fields.constellation = hero.constellationName;
    if (hero.constellationSource === "database") {
      fields.sourceTag = {
        label: "DB",
        color: getSourceAccentColor("database", "soft") ?? HS.heroMuted,
        background: "var(--luxia-opacity-brand-secondary-16)",
      };
    } else if (hero.constellationSource === "csv") {
      fields.sourceTag = {
        label: "CSV",
        color: getSourceAccentColor("csv", "soft") ?? HS.heroMuted,
        background: "var(--luxia-opacity-blue-16)",
      };
    } else if (hero.constellationSource === "pdf") {
      fields.sourceTag = {
        label: "PDF",
        color: getSourceAccentColor("pdf", "soft") ?? HS.heroMuted,
        background: "var(--luxia-opacity-blue-16)",
      };
    }
  }

  return fields;
}

function getHeroCornerMarkerStyle(
  hero: HomeHeroContent,
  entityType: HomeShortcutEntityType,
): { color: string; background: string } {
  if (entityType === "galaxy-conversation") {
    return {
      color: "var(--luxia-text-inverse)",
      background: "var(--luxia-purple-70)",
    };
  }
  if (hero.constellationSource === "database") {
    return {
      color: "var(--luxia-text-inverse)",
      background: "var(--luxia-purple-50)",
    };
  }
  if (hero.constellationSource === "csv" || hero.constellationSource === "pdf") {
    return {
      color: "var(--luxia-text-inverse)",
      background: "var(--luxia-blue-50)",
    };
  }
  return {
    color: "var(--luxia-text-inverse)",
    background: "var(--luxia-blue-60)",
  };
}

function HeroEntityCornerMarker({
  entityType,
  hero,
}: {
  entityType: HomeShortcutEntityType;
  hero: HomeHeroContent;
}) {
  const { color, background } = getHeroCornerMarkerStyle(hero, entityType);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 right-0 z-[2] flex h-14 w-14 items-center justify-center rounded-[0_var(--luxia-radius-16)_0_22px] md:h-16 md:w-16 md:rounded-[0_var(--luxia-radius-16)_0_25px] lg:h-[72px] lg:w-[72px] lg:rounded-[0_var(--luxia-radius-16)_0_28px]"
      style={{ color, background }}
    >
      <span className="hidden lg:inline-flex">
        <EntityIcon entityType={entityType} size={29} color="currentColor" />
      </span>
      <span className="hidden md:inline-flex lg:hidden">
        <EntityIcon entityType={entityType} size={25} color="currentColor" />
      </span>
      <span className="inline-flex md:hidden">
        <EntityIcon entityType={entityType} size={24} color="currentColor" />
      </span>
    </div>
  );
}

function HeroContextGroup({
  label,
  value,
  sourceTag,
}: {
  label: string;
  value: string;
  sourceTag?: HeroContextFields["sourceTag"];
}) {
  return (
    <div className="min-w-0">
      <p
        className="luxia-type-label-form"
        style={{ color: HS.heroSoft, fontSize: 13, lineHeight: 1.35 }}
      >
        {label}
      </p>
      <div className="flex min-w-0 items-center gap-2" style={{ marginTop: 6 }}>
        <p
          className="min-w-0 truncate luxia-type-body-default-strong"
          style={{ color: HS.heroContextValue, fontSize: 16, lineHeight: 1.35 }}
          title={value}
        >
          {value}
        </p>
        {sourceTag ? (
          <span
            className="inline-flex shrink-0 items-center rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
            style={{ color: sourceTag.color, background: sourceTag.background }}
          >
            {sourceTag.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface HomeHeroProps {
  hero: HomeHeroContent;
  heroEntityKey: HomeEntityKey | null;
  eligiblePrimaryItems: HomeRecentWorkItem[];
  projects: readonly HomeProjectCard[];
  onPrimary: () => void;
  onSecondary?: () => void;
  onTogglePin?: () => void;
  onSetPrimary: (entityKey: HomeEntityKey) => void;
  onDismissFromContinue: (entityKey: HomeEntityKey) => void;
  onViewAll: () => void;
}

export function HomeHero({
  hero,
  heroEntityKey,
  eligiblePrimaryItems,
  projects,
  onPrimary,
  onSecondary,
  onTogglePin,
  onSetPrimary,
  onDismissFromContinue,
  onViewAll,
}: HomeHeroProps) {
  const [changePrimaryOpen, setChangePrimaryOpen] = useState(false);

  const sectionHeading = (
    <SectionHeader
      title="Your focus"
      titleId="home-continue-heading"
      icon={<History size={22} strokeWidth={1.75} />}
      iconColor={HS.sectionIconContinue}
      onViewAll={onViewAll}
      viewAllAriaLabel="View all your work"
    />
  );

  const heroMenuItems = useMemo(() => {
    if (hero.kind === "empty") return [];
    const canDismiss = Boolean(heroEntityKey && (hero.kind === "galaxySession" || hero.kind === "chat"));

    return buildContinueFocusMenuItems({
      title: hero.title,
      focusAction: "change",
      visibilityAction: canDismiss ? "hide" : "none",
      onChangePrimary: () => setChangePrimaryOpen(true),
      onHide: heroEntityKey && canDismiss
        ? () => onDismissFromContinue(heroEntityKey)
        : undefined,
    });
  }, [hero, heroEntityKey, onDismissFromContinue]);

  if (hero.kind === "empty") {
    const emptyStyle = getHomeCardStyle("featuredProject");
    const emptyText = getProjectCardTypography(emptyStyle);
    const isAllHidden = hero.emptyReason === "allHidden";

    return (
      <section className={HI.sectionGap} aria-labelledby="home-continue-heading">
        {sectionHeading}
        <div
          className={`w-full overflow-hidden ${HI.cardPadFeatured}`}
          style={{
            background: emptyStyle.bg,
            border: `1px solid ${emptyStyle.border}`,
            borderRadius: HS.heroRadius,
          }}
        >
          <div style={{ maxWidth: HS.heroInnerContentMax }}>
            <h2 className="mb-2 luxia-type-heading-h2" style={{ color: emptyText.title, letterSpacing: "-0.025em" }}>
              {hero.title}
            </h2>
            <p className="mb-4 luxia-type-body-default" style={{ color: emptyText.primary }}>
              {hero.context}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAllHidden ? (
              <>
                <Button type="button" variant="primary" onClick={() => setChangePrimaryOpen(true)}>
                  {hero.primaryLabel}
                </Button>
                <Button type="button" variant="secondary" onClick={onViewAll}>
                  {hero.secondaryLabel}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="primary" onClick={onPrimary}>{hero.primaryLabel}</Button>
                {hero.secondaryLabel && onSecondary ? (
                  <Button type="button" variant="secondary" onClick={onSecondary}>{hero.secondaryLabel}</Button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {isAllHidden ? (
          <ChangePrimaryDialog
            open={changePrimaryOpen}
            items={eligiblePrimaryItems}
            currentKey={heroEntityKey}
            projects={projects}
            onClose={() => setChangePrimaryOpen(false)}
            onSelect={onSetPrimary}
          />
        ) : null}
      </section>
    );
  }

  const canPin = Boolean(onTogglePin) && (hero.kind === "galaxySession" || hero.kind === "chat");
  const heroEntityType = toEntityType(hero.kind);
  const contextFields = getHeroContextFields(hero);
  const showConstellation = Boolean(contextFields?.constellation);

  return (
    <section className={HI.sectionGap} aria-labelledby="home-continue-heading">
      {sectionHeading}

      <div
        className="relative w-full"
        style={{
          border: `1px solid ${HS.heroBorder}`,
          boxShadow: HS.heroShadow,
          borderRadius: HS.heroRadius,
        }}
      >
          <div
            className="relative overflow-hidden"
            style={{
              background: HS.heroSurface,
              borderRadius: HS.heroRadius,
            }}
          >
            {heroEntityType ? (
              <HeroEntityCornerMarker entityType={heroEntityType} hero={hero} />
            ) : null}

            <div className="relative z-[1] min-w-0 px-6 pb-6 pt-5">
              {canPin || heroMenuItems.length > 0 ? (
                <div className="absolute top-3 right-0 z-[2] mr-14 flex shrink-0 items-center gap-1 md:mr-[68px] lg:mr-[80px]">
                  {canPin ? (
                    <PinButton
                      pinned={Boolean(hero.isPinned)}
                      label={hero.title}
                      tone="dark"
                      controlSize="hero"
                      onToggle={onTogglePin!}
                    />
                  ) : null}
                  {heroMenuItems.length > 0 ? (
                    <HomeContinueMenu
                      label={hero.title}
                      tone="dark"
                      controlSize="hero"
                      items={heroMenuItems}
                    />
                  ) : null}
                </div>
              ) : null}

              <div
                className={`grid min-w-0 grid-cols-1 gap-y-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-x-14 lg:gap-y-0 ${
                  canPin || heroMenuItems.length > 0
                    ? "pr-[5.75rem] md:pr-24 lg:pr-[6.75rem]"
                    : ""
                }`}
              >
                <div className="min-w-0">
                  <h2
                    className="line-clamp-1 luxia-type-heading-h3"
                    style={{
                      color: HS.heroText,
                      fontSize: 30,
                      lineHeight: 1.2,
                      letterSpacing: "-0.025em",
                      fontWeight: 700,
                    }}
                    title={hero.title}
                  >
                    {hero.title}
                  </h2>

                  {hero.description ? (
                    <p
                      className="luxia-type-body-default"
                      style={{
                        color: HS.heroDescription,
                        marginTop: 12,
                        fontSize: 15,
                        lineHeight: 1.5,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      {hero.description}
                    </p>
                  ) : null}
                </div>

                <div className="min-w-0 lg:pt-0.5">
                  {contextFields ? (
                    <div className="space-y-4">
                      <HeroContextGroup label="Project" value={contextFields.project} />
                      {showConstellation ? (
                        <HeroContextGroup
                          label="Constellation"
                          value={contextFields.constellation!}
                          sourceTag={contextFields.sourceTag}
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {hero.meta ? (
                    <p
                      className="flex items-center gap-1.5 luxia-type-body-small"
                      style={{
                        color: HS.heroSoft,
                        marginTop: contextFields ? 18 : 0,
                        fontSize: 14,
                      }}
                    >
                      <History size={14} strokeWidth={1.75} aria-hidden className="shrink-0 opacity-85" />
                      <span>{hero.meta}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                className="flex flex-wrap items-center gap-4 border-t"
                style={{ borderColor: HS.heroBorder, marginTop: 16, paddingTop: 16 }}
              >
                <Button type="button" variant="primary" onClick={onPrimary}>
                  {hero.primaryLabel}
                </Button>
                {hero.secondaryLabel && onSecondary ? (
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={onSecondary}
                    className="!border-[var(--luxia-opacity-white-24)] !text-[var(--luxia-opacity-white-80)] hover:!bg-[var(--luxia-opacity-white-08)]"
                  >
                    {hero.secondaryLabel}
                    <LuxiaArrowRightIcon size={13} aria-hidden className="ml-0.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
      </div>

      <ChangePrimaryDialog
        open={changePrimaryOpen}
        items={eligiblePrimaryItems}
        currentKey={heroEntityKey}
        projects={projects}
        onClose={() => setChangePrimaryOpen(false)}
        onSelect={onSetPrimary}
      />
    </section>
  );
}
