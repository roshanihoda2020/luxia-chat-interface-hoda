export { ContinueWorkingBrowser } from "./ContinueWorkingBrowser";
export { HomePage, HomePageShell } from "./HomePage";
export { NewProjectModal } from "./NewProjectModal";
export { ProjectsBrowser } from "./ProjectsBrowser";
export { ViewAllAction } from "./ViewAllAction";
export { HOME_PROJECTS, HOME_RECENT_WORK, HERO_DESCRIPTION_PLACEHOLDER, resolveHeroDescription } from "./data";
export {
  readDismissedContinueKeys,
  readHomePrimaryPreference,
  resolveHomeHero,
  writeDismissedContinueKeys,
  writeHomePrimaryPreference,
  normalizeHomePrimaryPreference,
  homePrimaryPreferencesEqual,
  isManualHomeFocus,
} from "./homePrimaryPreference";
export type { HomePrimaryPreference, HomePrimaryMode } from "./homePrimaryPreference";
export { parseEntityKey } from "./homeEntityKeys";
export {
  readPinnedEntityOrder,
  readPinnedProjectIds,
  togglePinnedEntityKey,
  togglePinnedProjectId,
  writePinnedEntityOrder,
  writePinnedProjectIds,
} from "./homePinState";
export {
  getChatEntityKey,
  getGalaxyEntityKey,
  workItemEntityKey,
} from "./homeEntityKeys";
export type {
  HomeBrowseMode,
  HomeHeroContent,
  HomePageProps,
  HomeProjectCard,
  HomeRecentWorkItem,
  ProjectDestination,
} from "./types";
