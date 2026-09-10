export type {
  VidgetInboxAssistantTurn,
  VidgetInboxDateFilter,
  VidgetInboxFeedback,
  VidgetInboxProblemsFilter,
  VidgetInboxQuery,
  VidgetInboxRefinePayload,
  VidgetInboxReviewShare,
  VidgetInboxReviewShareScope,
  VidgetInboxSession,
  VidgetInboxTurn,
  VidgetInboxTurnRole,
  VidgetInboxVisitorTurn,
} from "./types";

export {
  EMPTY_VIDGET_INBOX_QUERY,
  filterVidgetInboxSessions,
  inboxQueryHasActiveFilters,
  sessionMatchesInboxQuery,
  uniqueInboxChannels,
  uniqueInboxConstellationIds,
  uniqueInboxLocales,
} from "./filters";

export {
  parseVidgetInboxQueryFromSearch,
  serializeVidgetInboxQuery,
  vidgetInboxQueryFromPartial,
  withVidgetInboxSession,
} from "./query";

export {
  VIDGET_INBOX_FIXTURE_SESSIONS,
  getVidgetInboxSessionById,
  getVidgetInboxSessionsForProject,
} from "./fixture";

export {
  assistantTurnHasProblem,
  assistantTurnIsProblematic,
  countSessionProblems,
  formatProblemCount,
  formatProblemSummary,
  summarizeSessionProblems,
} from "./problems";

export {
  buildInteractionCopyText,
  groupInboxInteractions,
  resolveRefineConstellationId,
} from "./interactions";
export type { VidgetInboxInteraction } from "./interactions";

export {
  conversationShareScope,
  createVidgetInboxReviewShare,
  describeShareScope,
  listVidgetInboxReviewShares,
  reviewSessionsForVidget,
  selectedShareScope,
  sessionIdsForShareScope,
  shareDialogCopy,
  vidgetShareScope,
} from "./share";

export {
  appendCapturedAssistantTurn,
  appendCapturedVisitorTurn,
  clearActiveCapturedSession,
  createCapturedVidgetInboxSession,
  getActiveCapturedSessionId,
  getCapturedVidgetInboxSessionById,
  getVidgetInboxCaptureVersion,
  listCapturedVidgetInboxSessions,
  localeFromVidgetLanguage,
  subscribeVidgetInboxCapture,
  updateCapturedAssistantFeedback,
} from "./sessionStore";

export { VidgetInboxPage } from "./VidgetInboxPage";
export type { VidgetInboxPageProps } from "./VidgetInboxPage";
