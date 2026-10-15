export const WA_MARK = "data-wa-mark";
export const WA_MARK_ID = "data-wa-mark-id";
export const WA_MARK_LABEL = "data-wa-mark-label";

export type WaMarkKind = "assist" | "revision" | "comment";

export type DocumentComment = {
  id: string;
  body: string;
  resolved: boolean;
  createdAt: number;
};

let markIdCounter = 0;

function nextMarkId(prefix: string): string {
  markIdCounter += 1;
  return `${prefix}-${markIdCounter}-${Date.now().toString(36)}`;
}

function unwrapElement(element: Element): void {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
  if (parent instanceof HTMLElement) parent.normalize();
}

export function clearMarksOfKind(root: HTMLElement, kind: WaMarkKind): void {
  const marks = Array.from(root.querySelectorAll(`[${WA_MARK}="${kind}"]`));
  for (const mark of marks) {
    unwrapElement(mark);
  }
}

export function clearAssistanceMark(root: HTMLElement): void {
  clearMarksOfKind(root, "assist");
}

export function clearRevisionMarks(root: HTMLElement): void {
  const marks = Array.from(root.querySelectorAll(`[${WA_MARK}="revision"]`));
  for (const mark of marks) {
    if (!(mark instanceof HTMLElement)) continue;
    if (mark.dataset.waCommentId) {
      const commentId = mark.dataset.waCommentId;
      mark.setAttribute(WA_MARK, "comment");
      mark.setAttribute(WA_MARK_ID, commentId);
      mark.setAttribute(WA_MARK_LABEL, mark.dataset.waCommentBody ?? "Comment");
      mark.classList.remove("wa-mark-revision");
      mark.classList.add("wa-mark-comment");
      mark.removeAttribute("title");
      continue;
    }
    unwrapElement(mark);
  }
}

export function clearCommentMarks(root: HTMLElement): void {
  clearMarksOfKind(root, "comment");
}

function wrapRange(range: Range, kind: WaMarkKind, id: string, label: string): HTMLElement | null {
  const span = document.createElement("span");
  span.setAttribute(WA_MARK, kind);
  span.setAttribute(WA_MARK_ID, id);
  span.setAttribute(WA_MARK_LABEL, label);
  if (kind === "assist") {
    span.className = "wa-mark-assist";
  } else if (kind === "revision") {
    span.className = "wa-mark-revision";
  } else {
    span.className = "wa-mark-comment";
  }

  try {
    range.surroundContents(span);
  } catch {
    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    } catch {
      return null;
    }
  }
  return span;
}

export function markAssistanceRange(root: HTMLElement, range: Range): Range | null {
  clearAssistanceMark(root);
  if (!root.contains(range.commonAncestorContainer) || range.collapsed) {
    return null;
  }
  const working = range.cloneRange();
  const span = wrapRange(
    working,
    "assist",
    nextMarkId("assist"),
    "Active Writing Assistant selection",
  );
  if (!span) return null;
  const next = document.createRange();
  next.selectNodeContents(span);
  return next;
}

export function getAssistanceMark(root: HTMLElement): HTMLElement | null {
  return root.querySelector(`[${WA_MARK}="assist"]`);
}

export function getAssistanceRange(root: HTMLElement): Range | null {
  const mark = getAssistanceMark(root);
  if (!mark) return null;
  const range = document.createRange();
  range.selectNodeContents(mark);
  return range;
}

function decorateRevisionElement(element: HTMLElement, id: string): void {
  element.setAttribute(WA_MARK, "revision");
  element.setAttribute(WA_MARK_ID, id);
  element.setAttribute(WA_MARK_LABEL, "Changed with Writing Assistant");
  element.classList.add("wa-mark-revision");
  element.setAttribute("title", "Changed with Writing Assistant");
}

export function replaceAssistanceWithRevision(
  root: HTMLElement,
  html: string,
): { range: Range; id: string } | null {
  const assist = getAssistanceMark(root);
  if (!assist) return null;

  const id = nextMarkId("revision");
  const template = document.createElement("template");
  template.innerHTML = html.trim() || "<span></span>";
  const nodes = Array.from(template.content.childNodes).filter(
    (node) => !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()),
  );

  let anchor: HTMLElement;
  if (nodes.length === 1 && nodes[0] instanceof HTMLElement) {
    anchor = nodes[0];
    decorateRevisionElement(anchor, id);
    assist.replaceWith(anchor);
  } else {
    anchor = document.createElement("span");
    decorateRevisionElement(anchor, id);
    for (const node of nodes) {
      anchor.appendChild(node);
    }
    if (!anchor.childNodes.length) {
      anchor.textContent = html.replace(/<[^>]+>/g, "");
    }
    assist.replaceWith(anchor);
  }

  const range = document.createRange();
  range.selectNodeContents(anchor);
  return { range, id };
}

export function setShowRevisionMarks(root: HTMLElement, show: boolean): void {
  root.classList.toggle("wa-show-revisions", show);
  root.classList.toggle("wa-hide-revisions", !show);
}

function applyCommentMetadata(host: HTMLElement, comment: DocumentComment): void {
  host.classList.add("wa-has-comment");
  host.dataset.waCommentId = comment.id;
  host.dataset.waCommentBody = comment.body;
  host.dataset.waCommentResolved = comment.resolved ? "true" : "false";
  if (host.getAttribute(WA_MARK) === "comment") {
    host.setAttribute(WA_MARK_ID, comment.id);
    host.setAttribute(WA_MARK_LABEL, comment.body);
  }
  // Strip any legacy in-flow comment icons so badges live in the margin only.
  host.querySelectorAll("[data-wa-comment-trigger]").forEach((node) => node.remove());
}

export type CommentAnchor = {
  id: string;
  body: string;
  element: HTMLElement;
};

export function listCommentAnchors(root: HTMLElement): CommentAnchor[] {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>("[data-wa-comment-id]"),
  );
  const seen = new Set<string>();
  const anchors: CommentAnchor[] = [];
  for (const element of nodes) {
    const id = element.dataset.waCommentId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    anchors.push({
      id,
      body: element.dataset.waCommentBody ?? "Comment",
      element,
    });
  }
  return anchors;
}

function findCommentHost(root: HTMLElement, commentId: string): HTMLElement | null {
  const byMark = root.querySelector(`[${WA_MARK}="comment"][${WA_MARK_ID}="${commentId}"]`);
  if (byMark instanceof HTMLElement) return byMark;
  const byData = root.querySelector(`[data-wa-comment-id="${commentId}"]`);
  return byData instanceof HTMLElement ? byData : null;
}

function convertMarkToComment(host: HTMLElement, comment: DocumentComment): HTMLElement {
  const kind = host.getAttribute(WA_MARK);
  if (kind === "assist") {
    host.classList.remove("wa-mark-assist");
    host.removeAttribute("title");
  }
  if (kind !== "revision") {
    host.setAttribute(WA_MARK, "comment");
    host.classList.add("wa-mark-comment");
  }
  applyCommentMetadata(host, comment);
  return host;
}

export function wrapSelectionAsComment(
  root: HTMLElement,
  range: Range,
  comment: DocumentComment,
): HTMLElement | null {
  if (!root.contains(range.commonAncestorContainer) || range.collapsed) {
    return null;
  }

  const existingComment = range.commonAncestorContainer instanceof Element
    ? range.commonAncestorContainer.closest(`[${WA_MARK}="comment"], [data-wa-comment-id]`)
    : range.commonAncestorContainer.parentElement?.closest(`[${WA_MARK}="comment"], [data-wa-comment-id]`);

  if (existingComment instanceof HTMLElement && root.contains(existingComment)) {
    applyCommentMetadata(existingComment, comment);
    return existingComment;
  }

  const revisionHost = range.commonAncestorContainer instanceof Element
    ? range.commonAncestorContainer.closest(`[${WA_MARK}="revision"]`)
    : range.commonAncestorContainer.parentElement?.closest(`[${WA_MARK}="revision"]`);

  if (revisionHost instanceof HTMLElement && root.contains(revisionHost)) {
    applyCommentMetadata(revisionHost, comment);
    return revisionHost;
  }

  // Prefer converting the active assistance mark instead of nesting wraps inside it.
  const assistHost = range.commonAncestorContainer instanceof Element
    ? range.commonAncestorContainer.closest(`[${WA_MARK}="assist"]`)
    : range.commonAncestorContainer.parentElement?.closest(`[${WA_MARK}="assist"]`);
  if (assistHost instanceof HTMLElement && root.contains(assistHost)) {
    return convertMarkToComment(assistHost, comment);
  }

  const assistMark = getAssistanceMark(root);
  if (assistMark && root.contains(assistMark)) {
    const assistRange = document.createRange();
    assistRange.selectNodeContents(assistMark);
    if (
      range.toString() === assistRange.toString()
      || (
        assistRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0
        && assistRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0
      )
    ) {
      return convertMarkToComment(assistMark, comment);
    }
  }

  const working = range.cloneRange();
  const span = wrapRange(working, "comment", comment.id, comment.body);
  if (!span) return null;
  applyCommentMetadata(span, comment);
  return span;
}

export function updateCommentMark(
  root: HTMLElement,
  comment: DocumentComment,
): void {
  const mark = findCommentHost(root, comment.id);
  if (!mark) return;
  applyCommentMetadata(mark, comment);
}

export function removeCommentMark(root: HTMLElement, commentId: string): void {
  const mark = findCommentHost(root, commentId);
  if (!mark) return;
  mark.querySelectorAll("[data-wa-comment-trigger]").forEach((node) => node.remove());
  mark.classList.remove("wa-has-comment");
  delete mark.dataset.waCommentId;
  delete mark.dataset.waCommentBody;
  delete mark.dataset.waCommentResolved;
  if (mark.getAttribute(WA_MARK) === "comment") {
    unwrapElement(mark);
  }
}

export function createComment(body: string): DocumentComment {
  return {
    id: nextMarkId("comment"),
    body: body.trim(),
    resolved: false,
    createdAt: Date.now(),
  };
}
