/**
 * PROTOTYPE tag-suggestion engine. No AI model is called. A fixed concept
 * lexicon stands in for the model so results are deterministic, synonyms
 * collapse (invoice / invoices / bills → Invoices), and a document with no
 * readable text is never presented as analysed.
 *
 * Inputs follow the spec where the prototype can: the start of the document's
 * extracted Markdown (when it exists) plus the filename, and the Data Source's
 * document vocabulary as the preferred set of tags.
 *
 * Integration differences, documented rather than imitated:
 * - The spec reads about the first 2,000 TOKENS; this simulator reads the
 *   first 2,000 whitespace-separated WORDS. No tokenizer is faked here.
 * - The spec reads the PDF text layer for files that are not extracted; the
 *   prototype has no file bytes, so those fall back to the filename only.
 * - The spec runs suggestions as a background task after extraction or
 *   upload; here the user starts them with Suggest tags.
 */
import {
  getDocumentExtractionStatus,
  type DataSourceDocumentRecord,
} from "@/app/features/data-sources/documents";
import { getDocumentReviewContent, hasReviewableContent } from "@/app/features/document-review";
import { findTagByName, normalizeTag } from "./model";
import { documentTagIdsFromLibrary, readOrganizationTagLibrary } from "./persistence";
import type {
  DocumentTagSuggestionRecord,
  TagSuggestionBasis,
  TagSuggestionItem,
} from "./tagSuggestionStore";
import type { OrganizationTagLibrary } from "./types";

/** Words, not tokens: see the integration notes above. */
export const SUGGESTION_WORD_LIMIT = 2000;
const MAX_SUGGESTIONS_PER_DOCUMENT = 4;
/** Scenario B (spec): at most one tag new to the Data Source per document. */
const MAX_NEW_TAGS_PER_DOCUMENT_WITH_VOCABULARY = 1;
/** Scenario A: size of the shared vocabulary consolidated across a new batch. */
const MAX_BATCH_VOCABULARY = 6;

interface Concept {
  key: string;
  label: string;
  /** Lowercase words or phrases that count as evidence. Synonyms of one concept. */
  terms: readonly string[];
}

/** Controlled prototype lexicon. Each concept is one tag, whatever synonym appears. */
const CONCEPTS: readonly Concept[] = [
  { key: "contracts", label: "Contracts", terms: ["contract", "contracts", "agreement", "agreements", "msa", "addendum", "statement of work", "sow"] },
  { key: "invoices", label: "Invoices", terms: ["invoice", "invoices", "bill", "bills", "billing"] },
  { key: "finance", label: "Finance", terms: ["fees", "fee", "payment", "payments", "payable", "eur", "usd", "pricing"] },
  { key: "legal", label: "Legal", terms: ["termination", "terminate", "liability", "indemnity", "governing law", "legal"] },
  { key: "confidentiality", label: "Confidentiality", terms: ["confidential", "confidentiality", "nda", "non-disclosure"] },
  { key: "hr", label: "HR", terms: ["employee", "employees", "handbook", "onboarding", "payroll"] },
  { key: "policy", label: "Policy", terms: ["policy", "policies", "guideline", "guidelines"] },
  { key: "operations", label: "Operations", terms: ["runbook", "incident", "procedure", "operations"] },
  { key: "reporting", label: "Reporting", terms: ["report", "reports", "reporting", "quarterly", "kpi"] },
  { key: "compliance", label: "Compliance", terms: ["compliance", "audit", "regulation", "gdpr"] },
];

function simplify(value: string): string {
  return (normalizeTag(value) ?? "").toLowerCase();
}

/** Concept a tag name belongs to (by label or synonym), so "Bills" and "Invoices" are one tag. */
export function conceptKeyForTagName(name: string): string {
  const key = simplify(name);
  const singular = key.endsWith("s") ? key.slice(0, -1) : key;
  const concept = CONCEPTS.find((item) =>
    simplify(item.label) === key || item.terms.includes(key) || item.terms.includes(singular));
  return concept?.key ?? `tag:${singular}`;
}

export interface VocabularyEntry {
  tagId: string;
  name: string;
  conceptKey: string;
}

/**
 * The Data Source's shared vocabulary: tags already used on its documents.
 * Organization tag definitions and Data Source-level tags are not part of it.
 */
export function dataSourceDocumentVocabulary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
  documents: readonly DataSourceDocumentRecord[],
): VocabularyEntry[] {
  const byId = new Map<string, VocabularyEntry>();
  for (const document of documents) {
    for (const tagId of documentTagIdsFromLibrary(library, dataSourceId, document)) {
      const tag = library.definitions[tagId];
      if (tag && !byId.has(tag.id)) byId.set(tag.id, { tagId: tag.id, name: tag.name, conceptKey: conceptKeyForTagName(tag.name) });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** The text the prototype may read: saved or sample extracted Markdown, never invented. */
export function readableDocumentText(dataSourceId: string, document: DataSourceDocumentRecord): string | null {
  const status = getDocumentExtractionStatus(dataSourceId, document.localDocumentId);
  if (status !== "EXTRACTED" && status !== "REVIEWED") return null;
  const content = getDocumentReviewContent(dataSourceId, document.localDocumentId);
  if (!content || !hasReviewableContent(content)) return null;
  const words = content.pages.map((page) => page.markdown).join("\n\n").split(/\s+/).filter(Boolean);
  return words.slice(0, SUGGESTION_WORD_LIMIT).join(" ");
}

function countTerm(haystack: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return haystack.match(new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "g"))?.length ?? 0;
}

function conceptHits(text: string): Map<string, { hits: number; evidence: Set<string> }> {
  const lower = text.toLowerCase();
  const result = new Map<string, { hits: number; evidence: Set<string> }>();
  for (const concept of CONCEPTS) {
    for (const term of concept.terms) {
      const count = countTerm(lower, term);
      if (count === 0) continue;
      const entry = result.get(concept.key) ?? { hits: 0, evidence: new Set<string>() };
      entry.hits += count;
      entry.evidence.add(term);
      result.set(concept.key, entry);
    }
  }
  return result;
}

function fingerprint(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  return (hash >>> 0).toString(36);
}

type Candidate = { conceptKey: string; label: string; hits: number; evidence: string[] };

function candidatesFor(text: string | null, fileName: string, vocabularyKeys: ReadonlySet<string>): Candidate[] {
  const filenameText = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[_\-.]+/g, " ");
  const fromName = conceptHits(filenameText);
  const fromText = text ? conceptHits(text) : new Map<string, { hits: number; evidence: Set<string> }>();
  const keys = new Set([...fromName.keys(), ...fromText.keys()]);
  const candidates: Candidate[] = [];
  for (const key of keys) {
    const concept = CONCEPTS.find((item) => item.key === key)!;
    const name = fromName.get(key);
    const body = fromText.get(key);
    const hits = (name?.hits ?? 0) + (body?.hits ?? 0);
    // With text: vocabulary tags need one mention, new tags need two (justified by content).
    // Filename only: one clear filename term is enough, and the basis says so.
    const needed = text ? (vocabularyKeys.has(key) ? 1 : 2) : 1;
    if (hits < needed) continue;
    candidates.push({
      conceptKey: key,
      label: concept.label,
      hits,
      evidence: [...new Set([...(name?.evidence ?? []), ...(body?.evidence ?? [])])],
    });
  }
  return candidates.sort((a, b) => b.hits - a.hits || a.label.localeCompare(b.label));
}

export type SuggestionOutcome =
  | { document: DataSourceDocumentRecord; kind: "suggested"; record: DocumentTagSuggestionRecord; added: number }
  | { document: DataSourceDocumentRecord; kind: "no-signal"; basis: TagSuggestionBasis };

let itemSequence = 0;

function mergeItems(
  previous: DocumentTagSuggestionRecord | null,
  candidates: readonly Candidate[],
  contentFingerprint: string,
  resolve: (candidate: Candidate) => { label: string; tagId: string | null; isNew: boolean },
  assignedConceptKeys: ReadonlySet<string>,
  /** Cap on pending suggestions new to the Data Source; Infinity in scenario A. */
  maxNewItems: number,
): { items: TagSuggestionItem[]; added: number } {
  const sameContent = previous?.contentFingerprint === contentFingerprint;
  // Changed content: earlier pending suggestions are kept as stale history.
  // Same content: pending ones are re-resolved, so a tag accepted elsewhere
  // since then is now offered as the existing vocabulary tag, not "New".
  const kept = (previous?.items ?? [])
    .filter((item) => !(item.state === "pending" && assignedConceptKeys.has(item.conceptKey)))
    .map((item) => {
      if (item.state !== "pending") return item;
      if (!sameContent) return { ...item, state: "stale" as const };
      const resolved = resolve({ conceptKey: item.conceptKey, label: item.label, hits: 0, evidence: item.evidence });
      return { ...item, label: resolved.label, tagId: resolved.tagId, isNewToVocabulary: resolved.isNew };
    });
  const blocked = new Set(
    kept
      .filter((item) => item.state === "pending" || (sameContent && item.state === "rejected"))
      .map((item) => item.conceptKey),
  );
  let added = 0;
  const items = [...kept];
  const pendingKept = kept.filter((item) => item.state === "pending");
  let capacity = Math.max(0, MAX_SUGGESTIONS_PER_DOCUMENT - pendingKept.length);
  let newCount = pendingKept.filter((item) => item.isNewToVocabulary).length;
  const fresh = candidates
    .filter((candidate) => !blocked.has(candidate.conceptKey) && !assignedConceptKeys.has(candidate.conceptKey));
  for (const candidate of fresh) {
    if (capacity === 0) break;
    const resolved = resolve(candidate);
    // Candidates are ordered by evidence, so the strongest new term is the one kept.
    if (resolved.isNew && newCount >= maxNewItems) continue;
    if (resolved.isNew) newCount += 1;
    capacity -= 1;
    itemSequence += 1;
    items.push({
      id: `sugg-${Date.now().toString(36)}-${itemSequence.toString(36)}`,
      label: resolved.label,
      conceptKey: candidate.conceptKey,
      tagId: resolved.tagId,
      isNewToVocabulary: resolved.isNew,
      state: "pending",
      evidence: candidate.evidence.slice(0, 4),
    });
    added += 1;
  }
  return { items, added };
}

/**
 * Suggest tags for `targets`. When the Data Source has no document vocabulary
 * yet (scenario A), candidates from the whole batch are consolidated into one
 * short shared vocabulary first; otherwise (scenario B) existing vocabulary
 * tags are preferred and anything else is marked New.
 */
export function generateTagSuggestions(input: {
  dataSourceId: string;
  targets: readonly DataSourceDocumentRecord[];
  allDocuments: readonly DataSourceDocumentRecord[];
  previous: Readonly<Record<string, DocumentTagSuggestionRecord>>;
  library?: OrganizationTagLibrary;
}): SuggestionOutcome[] {
  const library = input.library ?? readOrganizationTagLibrary();
  const vocabulary = dataSourceDocumentVocabulary(library, input.dataSourceId, input.allDocuments);
  const vocabularyByConcept = new Map(vocabulary.map((entry) => [entry.conceptKey, entry]));
  const vocabularyKeys = new Set(vocabularyByConcept.keys());

  const perDocument = input.targets.map((document) => {
    const text = readableDocumentText(input.dataSourceId, document);
    const basis: TagSuggestionBasis = text ? "extracted-text" : "filename";
    return {
      document,
      basis,
      text,
      candidates: candidatesFor(text, document.fileName, vocabularyKeys),
      contentFingerprint: fingerprint(`${basis}|${document.fileName}|${text ?? ""}`),
    };
  });

  // Scenario A: consolidate a short shared vocabulary across the batch.
  let allowedKeys: Set<string> | null = null;
  if (vocabulary.length === 0) {
    const frequency = new Map<string, number>();
    for (const entry of perDocument) {
      for (const candidate of entry.candidates) frequency.set(candidate.conceptKey, (frequency.get(candidate.conceptKey) ?? 0) + 1);
    }
    allowedKeys = new Set(
      [...frequency.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, MAX_BATCH_VOCABULARY)
        .map(([key]) => key),
    );
  }

  return perDocument.map((entry): SuggestionOutcome => {
    const candidates = allowedKeys ? entry.candidates.filter((c) => allowedKeys!.has(c.conceptKey)) : entry.candidates;
    if (candidates.length === 0) return { document: entry.document, kind: "no-signal", basis: entry.basis };
    const assigned = new Set(
      documentTagIdsFromLibrary(library, input.dataSourceId, entry.document)
        .map((tagId) => library.definitions[tagId])
        .filter(Boolean)
        .map((tag) => conceptKeyForTagName(tag!.name)),
    );
    const { items, added } = mergeItems(
      input.previous[entry.document.localDocumentId] ?? null,
      candidates,
      entry.contentFingerprint,
      (candidate) => {
        const inVocabulary = vocabularyByConcept.get(candidate.conceptKey);
        if (inVocabulary) return { label: inVocabulary.name, tagId: inVocabulary.tagId, isNew: false };
        // New to this Data Source; reuse an Organization definition with that name if one exists.
        const existing = findTagByName(library.definitions, candidate.label);
        return { label: existing?.name ?? candidate.label, tagId: existing?.id ?? null, isNew: true };
      },
      assigned,
      vocabulary.length === 0 ? Number.POSITIVE_INFINITY : MAX_NEW_TAGS_PER_DOCUMENT_WITH_VOCABULARY,
    );
    return {
      document: entry.document,
      kind: "suggested",
      added,
      record: {
        generatedAt: new Date().toISOString(),
        basis: entry.basis,
        contentFingerprint: entry.contentFingerprint,
        generator: "prototype-rules",
        items,
      },
    };
  });
}

/** True when the document's readable content changed since the suggestions were made. */
export function suggestionsAreOutdated(
  dataSourceId: string,
  document: DataSourceDocumentRecord,
  record: DocumentTagSuggestionRecord,
): boolean {
  const text = readableDocumentText(dataSourceId, document);
  const basis: TagSuggestionBasis = text ? "extracted-text" : "filename";
  return fingerprint(`${basis}|${document.fileName}|${text ?? ""}`) !== record.contentFingerprint;
}
