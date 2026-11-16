import { VERIFAI_SEVERITY_LABEL } from "./mockData";
import { countBySeverity } from "./verifaiStore";
import type { VerifaiFinding, VerifaiReview } from "./types";

export function reviewSummary(review: VerifaiReview): string {
  const total = review.checklist.requirementCount;
  if (review.findings.length === 0) return `All ${total} requirements met.`;
  const counts = countBySeverity(review.findings);
  const met = total - review.findings.length;
  const issues = [
    counts.major ? `${counts.major} major` : null,
    counts.minor ? `${counts.minor} minor` : null,
  ].filter(Boolean).join(" and ");
  const issueText = issues ? `${issues} issue${counts.major + counts.minor === 1 ? "" : "s"}` : "";
  const reviewText = counts.review ? `${counts.review} need${counts.review === 1 ? "s" : ""} review` : "";
  return `${met} of ${total} requirements met. ${[issueText, reviewText].filter(Boolean).join("; ")}.`.replace(/^./, (c) => c.toUpperCase());
}

export function reviewExplanation(review: VerifaiReview): string {
  const majors = review.findings.filter((f) => f.severity === "major");
  if (majors.length > 0) {
    const titles = majors.map((f) => f.title.charAt(0).toLowerCase() + f.title.slice(1));
    return `Fix before signing: ${titles.join("; ")}. The other findings can be agreed in the same revision.`;
  }
  if (review.findings.some((f) => f.severity === "review")) {
    return "No blocking issues. Items marked Need Review should be checked by a person before approval.";
  }
  if (review.findings.length > 0) return "No blocking issues. The findings are wording gaps that can be closed in one revision.";
  return "Every requirement was matched to a passage and confirmed. No changes needed.";
}

function findingLine(f: VerifaiFinding) {
  return `${f.requirementId} (${VERIFAI_SEVERITY_LABEL[f.severity]}) — ${f.title}`;
}

function rank(f: VerifaiFinding) {
  return f.severity === "major" ? 0 : f.severity === "minor" ? 1 : 2;
}

/** Simulated follow-up answer that uses the same review (and, if set, the selected finding). */
export function answerReviewFollowUp(review: VerifaiReview, question: string, findingId?: string): string {
  const q = question.toLowerCase();
  const finding = findingId ? review.findings.find((f) => f.id === findingId) : undefined;

  if (finding) {
    if (/clause|wording|rewrite|draft/.test(q)) return `Suggested wording for ${finding.requirementId}:\n\n"${finding.clause}"`;
    if (/evidence|where|page|quote/.test(q)) {
      return `${finding.requirementId} is based on ${finding.evidence.section}, page ${finding.evidence.page} of ${review.document.name}:\n\n"${finding.evidence.quote}"`;
    }
    return `${finding.requirementId}: ${finding.title}. ${finding.why}\n\nSuggested fix: ${finding.suggestedFix}`;
  }

  if (review.findings.length === 0) {
    return `All ${review.checklist.requirementCount} requirements in ${review.checklist.name} are met by ${review.document.name}. Nothing needs to change.`;
  }
  const mentioned = review.findings.find((f) => q.includes(f.requirementId.toLowerCase()));
  if (mentioned) return `${mentioned.requirementId}: ${mentioned.title}. ${mentioned.description}\n\nSuggested fix: ${mentioned.suggestedFix}`;
  if (/first|priorit|order|most important|urgent/.test(q)) {
    const ordered = [...review.findings].sort((a, b) => rank(a) - rank(b));
    return `Suggested order:\n${ordered.map((f, i) => `${i + 1}. ${findingLine(f)}`).join("\n")}\n\nStart with the major issues; they block signing.`;
  }
  if (/summar|brief|overview|legal|email/.test(q)) {
    return `${review.document.name} against ${review.checklist.name}: ${reviewSummary(review)}\n\n${review.findings.map((f) => `- ${findingLine(f)}`).join("\n")}`;
  }
  if (/major|critical|block/.test(q)) {
    const majors = review.findings.filter((f) => f.severity === "major");
    return majors.length ? majors.map((f) => `- ${findingLine(f)}: ${f.suggestedFix}`).join("\n") : "There are no major findings in this review.";
  }
  return `${reviewSummary(review)} Ask about a requirement ID (for example ${review.findings[0].requirementId}) for its evidence and a suggested fix.`;
}

export function reviewReportMarkdown(review: VerifaiReview): string {
  const counts = countBySeverity(review.findings);
  const date = new Date(review.completedAt ?? Date.now()).toLocaleString("en-US");
  const reportFindings = review.reportFindingIds
    .map((id) => review.findings.find((f) => f.id === id))
    .filter((f): f is VerifaiFinding => Boolean(f));
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
