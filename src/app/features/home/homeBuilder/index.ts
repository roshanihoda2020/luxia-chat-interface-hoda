export {
  HOME_LAYOUT_SCHEMA_VERSION,
} from "./types";
export type {
  HomeLayout,
  HomeTileConfig,
  HomeTileConfigValue,
  HomeTile,
  HomeTileSize,
  HomeTileTarget,
  HomeTileTargetScope,
  HomeTileType,
} from "./types";
export {
  HOME_TILE_GRID,
  HOME_TILE_SIZE_PRESETS,
  findHomeTileSizeByDimensions,
  getHomeTileSizePreset,
  homeTileRowsToPx,
  homeTileSlotHeightPx,
  homeTileBodyHeightPx,
  HOME_TILE_SECTION_HEADER,
} from "./grid";
export type { HomeTileSizePreset } from "./grid";
export {
  HOME_TILE_CATEGORY_LABELS,
  HOME_TILE_DEFINITIONS,
  getHomeTileDefinition,
  getHomeTileSizeId,
  homeTileHasOwnBottomSpacing,
  homeTileUsesContentHeight,
  isHomeTileType,
} from "./registry";
export type { HomeTileCategory, HomeTileDefinition } from "./registry";
export {
  addHomeTile,
  canAddHomeTileType,
  countHomeTilesOfType,
  createHomeTileId,
  findOpenHomeTileSlot,
  isHomeTileTargetOnLayout,
  moveHomeTileByKeyboard,
  placeHomeTileAt,
  removeHomeTile,
  resizeHomeTile,
  settleHomeTilesAfterMove,
  snapHomeTileSize,
} from "./layoutOps";
export type { HomeTileMoveDirection, HomeTileRect } from "./layoutOps";
export {
  HOME_TILE_EDGE_SNAP_COLUMNS,
  homeTileColumnPitch,
  measureHomeTileResize,
  snapHomeTileDrop,
  snapHomeTileToEdges,
} from "./dragGeometry";
export type { HomeTileRowBand } from "./dragGeometry";
export { HomeTileLibrary } from "./HomeTileLibrary";
export type { HomeTileTargetOption } from "./HomeTileLibrary";
export { HomeBuilderToolbar } from "./HomeBuilderToolbar";
export { useHomeLayout } from "./useHomeLayout";
export {
  HomeUnavailableTile,
  HomeTileFacts,
  HomeTileIcon,
  HomeTileOverline,
  HomeTileSurface,
  HomeTileText,
  HomeTileTitleAction,
} from "./HomeTileSurface";
export type { HomeTileDensity } from "./HomeTileSurface";
export { ProjectHomeTile } from "./ProjectHomeTile";
export { ToolHomeTile } from "./ToolHomeTile";
export { EntityHomeTile } from "./EntityHomeTile";
export type { EntityHomeTileAction, EntityHomeTileProps } from "./EntityHomeTile";
export { FocusHomeTile } from "./FocusHomeTile";
export { PROJECT_LIST_TILE_ROWS, ProjectListHomeTile } from "./ProjectListHomeTile";
export { DEFAULT_HOME_TILE_IDS, createDefaultHomeLayout } from "./defaultLayout";
export {
  HOME_LAYOUT_LIMITS,
  deserializeHomeLayout,
  parseHomeLayout,
  serializeHomeLayout,
} from "./validation";
export type { HomeLayoutParseResult } from "./validation";
export {
  clearHomeLayout,
  getHomeLayoutStorageKey,
  readHomeLayout,
  writeHomeLayout,
} from "./storage";
export type { HomeLayoutReadResult } from "./storage";
export { placeHomeTiles } from "./placement";
export type { HomeTilePlacement } from "./placement";
export { HomeTileGrid } from "./HomeTileGrid";
export { HomeTileSectionHeader } from "./HomeTileSectionHeader";
export type { HomeTileSection } from "./HomeTileSectionHeader";
export { HOME_TILE_SECTIONS, getHomeTileSection } from "./homeTileSections";
