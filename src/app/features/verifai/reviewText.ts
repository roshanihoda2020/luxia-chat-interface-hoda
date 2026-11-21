import { VERIFAI_SEVERITY_LABEL } from "./mockData";
import { countBySeverity } from "./verifaiStore";
import type { VerifaiFinding, VerifaiReview } from "./types";

/** Requirements the review could not decide (no passage addresses them), in checklist order. */
export function notAssessedRequirements(review: VerifaiReview) {
  const ids = new Set(review.requirementResults.filter((r) => r.status === "Not assessed").map((r) => r.requirementId));
  return review.checklist.requirements.filter((r) => ids.has(r.id));
}

/** Counts come from the stored requirement results, never from "requirements without a finding". */
export function reviewSummary(review: VerifaiReview): string {
  const total = review.checklist.requirementCount;
  const notAssessed = notAssessedRequirements(review).length;
  if (review.findings.length === 0 && notAssessed === 0) return `All ${total} requirements met.`;
  const counts = countBySeverity(review.findings);
  const met = review.requirementResults.filter((r) => r.status === "Met").length;
  const issues = [
    counts.major ? `${counts.major} major` : null,
    counts.minor ? `${counts.minor} minor` : null,
  ].filter(Boolean).join(" and ");
  const issueText = issues ? `${issues} issue${counts.major + counts.minor === 1 ? "" : "s"}` : "";
  const reviewText = counts.review ? `${counts.review} need${counts.review === 1 ? "s" : ""} review` : "";
  const notAssessedText = notAssessed ? `${notAssessed} not assessed` : "";
  return `${met} of ${total} requirements met. ${[issueText, reviewText, notAssessedText].filter(Boolean).join("; ")}.`.replace(/^./, (c) => c.toUpperCase());
}

export function reviewExplanation(review: VerifaiReview): string {
  const notAssessed = notAssessedRequirements(review).length;
  const unchecked = notAssessed === 0
    ? ""
    : notAssessed === 1
      ? " 1 requirement was not assessed because no passage in the document addresses it; check it manually."
      : ` ${notAssessed} requirements were not assessed because no passage in the document addresses them; check them manually.`;
  const majors = review.findings.filter((f) => f.severity === "major");
  if (majors.length > 0) {
    const titles = majors.map((f) => f.title.charAt(0).toLowerCase() + f.title.slice(1));
    return `Fix before signing: ${titles.join("; ")}. The other findings can be agreed in the same revision.${unchecked}`;
  }
  if (review.findings.some((f) => f.severity === "review")) {
    return `No blocking issues. Items marked Need Review should be checked by a person before approval.${unchecked}`;
  }
  if (review.findings.length > 0) return `No blocking issues. The findings are wording gaps that can be closed in one revision.${unchecked}`;
  if (notAssessed > 0) return `No issues were found in the requirements that could be checked.${unchecked}`;
  return "Every requirement was matched to a passage and confirmed. No changes needed.";
}

function findingLine(f: VerifaiFinding) {
  return `${f.requirementId} (${VERIFAI_SEVERITY_LABEL[f.severity]}) — ${f.title}`;
}

function rank(f: VerifaiFinding) {
  return f.severity === "major" ? 0 : f.severity === "minor" ? 1 : 2;
}

/** A question about one finding: suggested wording, its evidence, or why it matters and how to fix it. */
function findingAnswer(review: VerifaiReview, finding: VerifaiFinding, q: string, named: boolean): string {
  if (/clause|wording|rewrite|draft/.test(q)) return `Suggested wording for ${finding.requirementId}:\n\n"${finding.clause}"`;
  if (/evidence|where|page|quote/.test(q)) {
    return `${finding.requirementId} is based on ${finding.evidence.section}, page ${finding.evidence.page} of ${review.document.name}:\n\n"${finding.evidence.quote}"`;
  }
  // Naming a requirement without asking why: what the finding is and how to fix it.
  if (named && !/why|matter|problem|important|explain/.test(q)) {
    return `${finding.requirementId}: ${finding.title}. ${finding.description}\n\nSuggested fix: ${finding.suggestedFix}`;
  }
  return `${finding.requirementId}: ${finding.title}. ${finding.why}\n\nSuggested fix: ${finding.suggestedFix}`;
}

/** A question about one requirement: its finding when it has one, otherwise its stored result. */
function requirementAnswer(review: VerifaiReview, requirementId: string, q: string, named: boolean): string {
  const finding = review.findings.find((f) => f.requirementId === requirementId);
  if (finding) return findingAnswer(review, finding, q, named);
  const requirement = review.checklist.requirements.find((r) => r.id === requirementId);
  const status = review.requirementResults.find((r) => r.requirementId === requirementId)?.status;
  const text = requirement ? `"${requirement.text}"` : "this requirement";
  if (status === "Met") return `${requirementId} is met. No issue was found for ${text} in ${review.document.name}, so nothing needs to change.`;
  if (review.status === "failed") return `${requirementId} was not checked: the review failed before the compliance checks.`;
  return `${requirementId} was not assessed. No passage in ${review.document.name} addresses ${text}, so VerifAI cannot say whether it is met. Check it manually or use a checklist written for this kind of document.`;
}

/**
 * Simulated follow-up answer, shared by Chat and the VerifAI Tool. The question decides the scope:
 * a requirement it names first, then review-level questions (priorities, summary, major issues,
 * what needs attention), and only then the selected finding or requirement (`findingId` /
 * `requirementId`), so a selection never overrides what was actually asked.
 */
export function answerReviewFollowUp(review: VerifaiReview, question: string, findingId?: string, requirementId?: string): string {
  const q = question.toLowerCase();
  const finding = findingId ? review.findings.find((f) => f.id === findingId) : undefined;
  const notAssessed = notAssessedRequirements(review);

  const named = [...review.checklist.requirements]
    .sort((a, b) => b.id.length - a.id.length)
    .find((r) => q.includes(r.id.toLowerCase()));
  if (named) return requirementAnswer(review, named.id, q, true);

  if (/first|priorit|order|most important|urgent/.test(q)) {
    if (!review.findings.length) return `There is nothing to fix. ${reviewSummary(review)}`;
    const ordered = [...review.findings].sort((a, b) => rank(a) - rank(b));
    return `Suggested order:\n${ordered.map((f, i) => `${i + 1}. ${findingLine(f)}`).join("\n")}\n\nStart with the major issues; they block signing.`;
  }
  if (/summar|brief|overview|legal|email/.test(q)) {
    const lines = [
      ...review.findings.map((f) => `- ${findingLine(f)}`),
      ...notAssessed.map((r) => `- ${r.id} (Not assessed) — ${r.text}`),
    ];
    return `${review.document.name} against ${review.checklist.name}: ${reviewSummary(review)}${lines.length ? `\n\n${lines.join("\n")}` : ""}`;
  }
  if (/major|critical|block/.test(q)) {
    const majors = review.findings.filter((f) => f.severity === "major");
    return majors.length ? majors.map((f) => `- ${findingLine(f)}: ${f.suggestedFix}`).join("\n") : "There are no major findings in this review.";
  }
  if (/attention|which requirements|open items|missing|not met|to fix/.test(q)) {
    const lines = [
      ...[...review.findings].sort((a, b) => rank(a) - rank(b)).map((f) => `- ${findingLine(f)}`),
      ...notAssessed.map((r) => `- ${r.id} (Not assessed) — check it manually`),
    ];
    return lines.length ? `These requirements need attention:\n${lines.join("\n")}` : `None. ${reviewSummary(review)}`;
  }

  if (finding) return findingAnswer(review, finding, q, false);
  if (requirementId) return requirementAnswer(review, requirementId, q, false);

  if (review.findings.length === 0 && notAssessed.length === 0) {
    return `All ${review.checklist.requirementCount} requirements in ${review.checklist.name} are met by ${review.document.name}. Nothing needs to change.`;
  }
  const example = review.findings[0]?.requirementId ?? notAssessed[0]?.id ?? review.checklist.requirements[0]?.id;
  return `${reviewSummary(review)} Ask about a requirement ID (for example ${example}) for its evidence and a suggested fix.`;
}

export function reviewReportMarkdown(review: VerifaiReview): string {
  const counts = countBySeverity(review.findings);
  const date = new Date(review.completedAt ?? Date.now()).toLocaleString("en-US");
  const reportFindings = review.reportFindingIds
    .map((id) => review.findings.find((f) => f.id === id))
    .filter((f): f is VerifaiFinding => Boolean(f));
  const notAssessed = notAssessedRequirements(review);
  return [
    `# VerifAI review report`,
    ``,
    `- Target document: ${review.document.name} (${review.document.pages} pages)`,
    `- Checklist: ${review.checklist.name} (${review.checklist.requirementCount} requirements)`,
    `- Project: ${review.projectName}`,
    `- Scope: ${review.scope.constellationLabel}`,
    `- Completed: ${date}`,
    `- Major: ${counts.major} · Minor: ${counts.minor} · Need Review: ${counts.review}`,
    ``,
    `## Summary`,
    ``,
    reviewSummary(review),
    ``,
    reviewExplanation(review),
    ``,
    ...(notAssessed.length ? [`## Not assessed`, ``, ...notAssessed.map((r) => `- ${r.id}: ${r.text}`), ``] : []),
    ...(reportFindings.length ? [`## Report sections`, ``, ...reportFindings.flatMap((f) => [f.reportSection, ``])] : []),
    ...(review.findings.length
      ? [
          `## Review Findings`,
          ``,
          ...review.findings.flatMap((f) => [
            `### ${f.requirementId} · ${VERIFAI_SEVERITY_LABEL[f.severity]} · ${f.status}`,
            ``,
            `**${f.title}**`,
            ``,
            f.description,
            ``,
            `- Requirement: ${f.requirement}`,
            `- Evidence (${f.evidence.section}, page ${f.evidence.page}): "${f.evidence.quote}"`,
            `- Suggested fix: ${f.suggestedFix}`,
            ``,
          ]),
        ]
      : []),
  ].join("\n").trimEnd() + "\n";
}

export function reviewReportFileName(review: VerifaiReview): string {
  const base = review.document.name.replace(/\.pdf$/i, "").replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  return `VerifAI-review-${base}.md`;
}
