export { ContinueWorkingBrowser } from "./ContinueWorkingBrowser";
export { HomePage, HomePageShell } from "./HomePage";
export { ViewAllAction } from "./ViewAllAction";
export { HOME_RECENT_WORK, HERO_DESCRIPTION_PLACEHOLDER, resolveHeroDescription } from "./data";
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
  togglePinnedEntityKey,
  writePinnedEntityOrder,
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

/** Project domain re-exports for App shell convenience (canonical owner: features/project). */
export {
  NewProjectModal,
  ProjectsBrowser,
  HOME_PROJECTS,
  getProjectPath,
  parseProjectIdFromPath,
  isHomePath,
  readPinnedProjectIds,
  togglePinnedProjectId,
  writePinnedProjectIds,
} from "@/app/features/project";
