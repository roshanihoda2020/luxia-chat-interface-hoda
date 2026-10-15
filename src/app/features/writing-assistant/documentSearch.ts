const SEARCH_MATCH = "wa-search-match";
const SEARCH_CURRENT = "wa-search-current";

export type DocumentSearchResult = {
  total: number;
  currentIndex: number;
};

type TextSegment = {
  node: Text;
  start: number;
  end: number;
};

function supportsCssHighlights(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";
}

function collectTextSegments(root: HTMLElement): TextSegment[] {
  const segments: TextSegment[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const length = textNode.data.length;
    if (length > 0) {
      segments.push({ node: textNode, start: offset, end: offset + length });
      offset += length;
    }
    node = walker.nextNode();
  }
  return segments;
}

export function buildSearchRanges(root: HTMLElement, query: string): Range[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const segments = collectTextSegments(root);
  if (segments.length === 0) return [];

  const fullText = segments.map((segment) => segment.node.data).join("");
  const haystack = fullText.toLowerCase();
  const needle = trimmed.toLowerCase();
  const ranges: Range[] = [];
  let from = 0;

  while (from <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;
    const endIndex = index + needle.length;
    const startSeg = segments.find((segment) => index >= segment.start && index < segment.end);
    const endSeg = segments.find(
      (segment) => endIndex > segment.start && endIndex <= segment.end,
    );

    if (startSeg && endSeg) {
      try {
        const range = document.createRange();
        range.setStart(startSeg.node, index - startSeg.start);
        range.setEnd(endSeg.node, endIndex - endSeg.start);
        ranges.push(range);
      } catch {
        /* skip invalid range */
      }
    }

    from = index + Math.max(needle.length, 1);
  }

  return ranges;
}

function clearCssHighlights(): void {
  if (!supportsCssHighlights()) return;
  CSS.highlights.delete(SEARCH_MATCH);
  CSS.highlights.delete(SEARCH_CURRENT);
}

export function clearDocumentSearch(_root?: HTMLElement): void {
  clearCssHighlights();
}

function scrollRangeIntoView(root: HTMLElement, range: Range): void {
  try {
    const rect = range.getBoundingClientRect();
    const container = root.closest(".overflow-y-auto") ?? root.parentElement;
    if (!(container instanceof HTMLElement)) return;
    const containerRect = container.getBoundingClientRect();
    if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
      const top = rect.top - containerRect.top + container.scrollTop - container.clientHeight / 3;
      container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  } catch {
    /* ignore */
  }
}

export function applyDocumentSearch(
  root: HTMLElement,
  query: string,
  currentIndex: number,
): DocumentSearchResult {
  clearDocumentSearch(root);

  const ranges = buildSearchRanges(root, query);
  if (ranges.length === 0) {
    return { total: 0, currentIndex: -1 };
  }

  const safeIndex = ((currentIndex % ranges.length) + ranges.length) % ranges.length;
  const current = ranges[safeIndex];

  if (supportsCssHighlights()) {
    const others = ranges.filter((_, index) => index !== safeIndex);
    if (others.length > 0) {
      CSS.highlights.set(SEARCH_MATCH, new Highlight(...others));
    }
    CSS.highlights.set(SEARCH_CURRENT, new Highlight(current));
  }

  scrollRangeIntoView(root, current);
  return { total: ranges.length, currentIndex: safeIndex };
}
