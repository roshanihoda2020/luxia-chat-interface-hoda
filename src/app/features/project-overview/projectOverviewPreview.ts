/** Max preview rows for Project overview summary cards (Constellations, Chats). */
export const PROJECT_SUMMARY_PREVIEW_LIMIT = 3;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Parse prototype relative timestamps ("2h ago", "1d ago", "Just now") or ISO strings
 * into a numeric recency value for stable preview ordering.
 */
export function parseLuxiaRelativeTimestamp(label: string, now = Date.now()): number | undefined {
  const trimmed = label.trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const lower = trimmed.toLowerCase();
  if (lower === "just now" || lower === "today") return now;
  if (lower === "yesterday") return now - DAY_MS;

  const hoursMatch = /^(\d+)\s*h(?:ours?)?\s*ago$/i.exec(trimmed);
  if (hoursMatch) return now - Number(hoursMatch[1]) * HOUR_MS;

  const daysMatch = /^(\d+)\s*d(?:ays?)?\s*ago$/i.exec(trimmed);
  if (daysMatch) return now - Number(daysMatch[1]) * DAY_MS;

  return undefined;
}

export interface ProjectSummaryPreviewResult<T> {
  total: number;
  preview: T[];
}

/**
 * Derive a non-mutating preview list for Project summary cards.
 *
 * Ordering: when `getRecencyTimestamp` is provided, sorts most-recent first
 * (higher timestamp wins; missing timestamps sort last). Otherwise preserves
 * the incoming list order and takes the first `limit` items.
 */
export function deriveProjectSummaryPreview<T>(
  items: readonly T[],
  options?: {
    limit?: number;
    getRecencyTimestamp?: (item: T) => number | undefined;
  },
): ProjectSummaryPreviewResult<T> {
  const limit = options?.limit ?? PROJECT_SUMMARY_PREVIEW_LIMIT;
  const total = items.length;

  if (total === 0) {
    return { total: 0, preview: [] };
  }

  const getTimestamp = options?.getRecencyTimestamp;
  if (getTimestamp) {
    const hasReliableRecency = items.some((item) => {
      const stamp = getTimestamp(item);
      return typeof stamp === "number" && stamp > 0;
    });
    if (hasReliableRecency) {
      const sorted = items
        .slice()
        .sort((a, b) => (getTimestamp(b) ?? 0) - (getTimestamp(a) ?? 0));
      return { total, preview: sorted.slice(0, limit) };
    }
  }

  // Stable deterministic order: first N from the canonical incoming list.
  return { total, preview: items.slice(0, limit) };
}

export function buildProjectViewAllLabel(
  total: number,
  options: {
    zeroLabel: string;
    singular: string;
    plural: string;
    /** Include numeric count whenever total > 0 (Constellations card). */
    alwaysShowCount?: boolean;
    previewLimit?: number;
  },
): string {
  const limit = options.previewLimit ?? PROJECT_SUMMARY_PREVIEW_LIMIT;
  const entity = total === 1 ? options.singular : options.plural;

  if (total === 0) return options.zeroLabel;
  if (options.alwaysShowCount || total > limit) {
    return `View all ${total} ${entity}`;
  }
  return `View all ${options.plural}`;
}
