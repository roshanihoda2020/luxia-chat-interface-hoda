import { HOME_TILE_GRID, HOME_TILE_SIZE_PRESETS } from "./grid";
import { migrateHomeLayoutData } from "./migration";
import { getHomeTileDefinition, isHomeTileType } from "./registry";
import {
  HOME_LAYOUT_SCHEMA_VERSION,
  isHomeTileSurfaceStyle,
  type HomeLayout,
  type HomeTileConfig,
  type HomeTile,
  type HomeTileTarget,
} from "./types";

/** Guards against corrupted or runaway stored data. */
export const HOME_LAYOUT_LIMITS = {
  maxTiles: 48,
  maxRow: 500,
  maxIdLength: 128,
  maxConfigKeys: 24,
} as const;

export type HomeLayoutParseResult =
  | { ok: true; layout: HomeLayout }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGridInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonEmptyId(value: unknown): value is string {
  return (
    typeof value === "string"
    && value.trim().length > 0
    && value.length <= HOME_LAYOUT_LIMITS.maxIdLength
  );
}

function parseTarget(
  raw: unknown,
  allowedScopes: readonly string[],
): HomeTileTarget | string {
  if (!isPlainObject(raw)) return "target must be an object";
  if (typeof raw.scope !== "string" || !allowedScopes.includes(raw.scope)) {
    return `target scope "${String(raw.scope)}" is not allowed`;
  }
  if (!isNonEmptyId(raw.entityId)) return "target entityId is invalid";
  if (raw.projectId !== undefined && !isNonEmptyId(raw.projectId)) {
    return "target projectId is invalid";
  }
  return {
    scope: raw.scope as HomeTileTarget["scope"],
    entityId: raw.entityId,
    ...(raw.projectId !== undefined ? { projectId: raw.projectId as string } : {}),
  };
}

function parseConfig(raw: unknown): HomeTileConfig | string {
  if (raw === undefined) return {};
  if (!isPlainObject(raw)) return "config must be an object";
  const entries = Object.entries(raw);
  if (entries.length > HOME_LAYOUT_LIMITS.maxConfigKeys) return "config has too many keys";
  const config: HomeTileConfig = {};
  for (const [key, value] of entries) {
    const valid =
      value === null
      || typeof value === "string"
      || typeof value === "boolean"
      || (typeof value === "number" && Number.isFinite(value));
    if (!valid) return `config "${key}" must be a string, number, boolean or null`;
    // An unknown card style falls back to the tile's default instead of rejecting the layout.
    if (key === "surface" && !isHomeTileSurfaceStyle(value)) continue;
    config[key] = value as HomeTileConfig[string];
  }
  return config;
}

function parseTile(raw: unknown, index: number): HomeTile | string {
  const at = `tile ${index}`;
  if (!isPlainObject(raw)) return `${at}: must be an object`;
  if (!isNonEmptyId(raw.id)) return `${at}: id is invalid`;
  if (!isHomeTileType(raw.type)) return `${at}: unknown type "${String(raw.type)}"`;

  const { x, y, w, h } = raw;
  if (!isGridInt(x) || !isGridInt(y) || !isGridInt(w) || !isGridInt(h)) {
    return `${at}: x, y, w and h must be non-negative integers`;
  }
  if (x + w > HOME_TILE_GRID.columns) return `${at}: exceeds ${HOME_TILE_GRID.columns} columns`;
  if (y > HOME_LAYOUT_LIMITS.maxRow) return `${at}: row is out of range`;

  const definition = getHomeTileDefinition(raw.type);
  const sizeAllowed = definition.allowedSizes.some((sizeId) => {
    const preset = HOME_TILE_SIZE_PRESETS[sizeId];
    return preset.w === w && preset.h === h;
  });
  if (!sizeAllowed) return `${at}: size ${w}x${h} is not allowed for "${raw.type}"`;

  let target: HomeTileTarget | undefined;
  if (raw.target !== undefined) {
    const parsed = parseTarget(raw.target, definition.targetScopes);
    if (typeof parsed === "string") return `${at}: ${parsed}`;
    target = parsed;
  } else if (definition.requiresTarget) {
    return `${at}: a target is required for "${raw.type}"`;
  }

  const config = parseConfig(raw.config);
  if (typeof config === "string") return `${at}: ${config}`;

  return {
    id: raw.id,
    type: raw.type,
    ...(target ? { target } : {}),
    x,
    y,
    w,
    h,
    config,
  };
}

function overlaps(a: HomeTile, b: HomeTile): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * Validates untrusted layout data and returns a clean copy.
 * Tile order is kept exactly as given; nothing is sorted or repositioned.
 */
export function parseHomeLayout(raw: unknown): HomeLayoutParseResult {
  if (!isPlainObject(raw)) return { ok: false, error: "layout must be an object" };
  if (raw.schemaVersion !== HOME_LAYOUT_SCHEMA_VERSION) {
    return { ok: false, error: `unsupported schemaVersion "${String(raw.schemaVersion)}"` };
  }
  if (!Array.isArray(raw.tiles)) return { ok: false, error: "tiles must be an array" };
  if (raw.tiles.length > HOME_LAYOUT_LIMITS.maxTiles) {
    return { ok: false, error: "too many tiles" };
  }

  const tiles: HomeTile[] = [];
  const ids = new Set<string>();
  for (let index = 0; index < raw.tiles.length; index += 1) {
    const tile = parseTile(raw.tiles[index], index);
    if (typeof tile === "string") return { ok: false, error: tile };
    if (ids.has(tile.id)) return { ok: false, error: `duplicate tile id "${tile.id}"` };
    const collision = tiles.find((placed) => overlaps(placed, tile));
    if (collision) {
      return { ok: false, error: `tile "${tile.id}" overlaps "${collision.id}"` };
    }
    ids.add(tile.id);
    tiles.push(tile);
  }

  return { ok: true, layout: { schemaVersion: HOME_LAYOUT_SCHEMA_VERSION, tiles } };
}

/** JSON for storage. Returns null when the layout does not validate. */
export function serializeHomeLayout(layout: HomeLayout): string | null {
  const result = parseHomeLayout(layout);
  return result.ok ? JSON.stringify(result.layout) : null;
}

/** Parses stored JSON text (migrating older versions); malformed JSON is reported, never thrown. */
export function deserializeHomeLayout(text: string): HomeLayoutParseResult {
  try {
    return parseHomeLayout(migrateHomeLayoutData(JSON.parse(text) as unknown).data);
  } catch {
    return { ok: false, error: "stored layout is not valid JSON" };
  }
}
