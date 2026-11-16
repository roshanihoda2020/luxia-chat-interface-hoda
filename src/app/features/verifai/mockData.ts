import type {
  VerifaiDocument,
  VerifaiDocumentTemplate,
  VerifaiFinding,
  VerifaiStage,
  VerifaiStageId,
} from "./types";

export type VerifaiChecklistDefinition = {
  id: "gdpr" | "procurement";
  name: string;
  fileName: string;
  uploaded: string;
  sections: Array<{ title: string; requirements: Array<{ id: string; text: string }> }>;
};

export const VERIFAI_GDPR_CHECKLIST: VerifaiChecklistDefinition = {
  id: "gdpr",
  name: "GDPR Vendor Checklist",
  fileName: "GDPR Vendor Checklist.xlsx",
  uploaded: "Uploaded 3 days ago",
  sections: [
    {
      title: "Data protection",
      requirements: [
        { id: "REQ-01", text: "The agreement names the controller and the processor." },
        { id: "REQ-02", text: "Processing is limited to documented instructions." },
        { id: "REQ-03", text: "Personal data breaches are notified within 72 hours." },
        { id: "REQ-04", text: "Staff with access are bound by confidentiality." },
        { id: "REQ-05", text: "Data subject requests are supported within 10 days." },
        { id: "REQ-06", text: "International transfers use approved safeguards." },
        { id: "REQ-07", text: "Sub-processors require prior written approval." },
      ],
    },
    {
      title: "Security",
      requirements: [
        { id: "REQ-08", text: "Access to personal data is role-based and logged." },
        { id: "REQ-09", text: "Backups are tested at least twice a year." },
        { id: "REQ-10", text: "Security incidents follow a documented response plan." },
        { id: "REQ-11", text: "The customer may audit the supplier on reasonable notice." },
        { id: "REQ-12", text: "Vulnerabilities are patched within agreed time frames." },
      ],
    },
    {
      title: "Records and retention",
      requirements: [
        { id: "REQ-13", text: "Processing records are kept and available on request." },
        { id: "REQ-14", text: "Data is returned or deleted within 30 days of termination." },
        { id: "REQ-15", text: "Deletion is confirmed in writing." },
        { id: "REQ-16", text: "Encryption at rest uses a named industry standard." },
      ],
    },
    {
      title: "Liability",
      requirements: [
        { id: "REQ-17", text: "Insurance cover is stated with a minimum amount." },
        { id: "REQ-18", text: "Data protection claims are not limited by the general cap." },
      ],
    },
  ],
};

export const VERIFAI_PROCUREMENT_CHECKLIST: VerifaiChecklistDefinition = {
  id: "procurement",
  name: "Procurement Contract Checklist",
  fileName: "Procurement Contract Checklist.docx",
  uploaded: "Uploaded last week",
  sections: [
    {
      title: "Commercial terms",
      requirements: [
        { id: "PC-01", text: "Parties, term and renewal are stated." },
        { id: "PC-02", text: "Prices are fixed for the initial term." },
        { id: "PC-03", text: "Invoices are itemised." },
        { id: "PC-04", text: "Payment is due within 30 days of invoice." },
      ],
    },
    {
      title: "Service and exit",
      requirements: [
        { id: "PC-05", text: "Service levels are measurable." },
        { id: "PC-06", text: "Service credits apply when service levels are missed." },
        { id: "PC-07", text: "Either party may terminate for convenience with 90 days' notice." },
        { id: "PC-08", text: "Exit assistance is provided at termination." },
      ],
    },
    {
      title: "Risk and compliance",
      requirements: [
        { id: "PC-09", text: "Liability is capped at no less than 12 months' fees." },
        { id: "PC-10", text: "Insurance cover is stated with a minimum amount." },
        { id: "PC-11", text: "Governing law and jurisdiction are stated." },
        { id: "PC-12", text: "Subcontracting requires prior approval." },
      ],
    },
  ],
};

export const VERIFAI_CHECKLISTS = [VERIFAI_GDPR_CHECKLIST, VERIFAI_PROCUREMENT_CHECKLIST];

export function checklistRequirementCount(checklist: VerifaiChecklistDefinition) {
  return checklist.sections.reduce((total, section) => total + section.requirements.length, 0);
}

/** A checklist file uploaded in this session is read as these 12 requirements in 3 sections (simulated). */
const UPLOADED_SOURCE_IDS = ["REQ-01", "REQ-03", "REQ-04", "REQ-07", "REQ-08", "REQ-10", "REQ-11", "REQ-13", "REQ-14", "REQ-15", "REQ-16", "REQ-18"];
export const VERIFAI_UPLOADED_CHECKLIST_SECTIONS = 3;
export function uploadedChecklistRequirements() {
  const all = VERIFAI_GDPR_CHECKLIST.sections.flatMap((s) => s.requirements);
  return UPLOADED_SOURCE_IDS.map((sourceId, index) => ({
    id: `UC-${String(index + 1).padStart(2, "0")}`,
    text: all.find((r) => r.id === sourceId)!.text,
  }));
}

export const VERIFAI_MANUAL_SAMPLE = [
  "Personal data breaches are notified within 72 hours.",
  "Sub-processors require prior written approval.",
  "The customer may audit the supplier on reasonable notice.",
  "Data is returned or deleted within 30 days of termination.",
  "Encryption at rest uses a named industry standard.",
  "Data protection claims are not limited by the general cap.",
].join("\n");

const SCOPE_DOCUMENTS: Array<Omit<VerifaiDocument, "id" | "origin">> = [
  { name: "Supplier Services Agreement v3.pdf", pages: 24, sizeLabel: "1.8 MB", updated: "Updated 2 days ago", template: "supplier" },
  { name: "Data Processing Addendum.pdf", pages: 11, sizeLabel: "640 KB", updated: "Updated last week", template: "dpa" },
  { name: "Information Security Policy 2026.pdf", pages: 38, sizeLabel: "3.2 MB", updated: "Updated 3 weeks ago", template: "security" },
];

/** Review PDFs available in a Constellation scope (mock). */
export function verifaiScopeDocuments(constellationId: string): VerifaiDocument[] {
  return SCOPE_DOCUMENTS.map((doc, index) => ({
    ...doc,
    id: `${constellationId}:doc-${index + 1}`,
    origin: "scope",
  }));
}

export const VERIFAI_STAGE_BLUEPRINT: Array<Pick<VerifaiStage, "id" | "label" | "description">> = [
  { id: "text", label: "Document text prepared", description: "Reading the PDF and splitting it into sections and passages." },
  { id: "checklist", label: "Checklist prepared", description: "Turning the checklist into individual, checkable requirements." },
  { id: "match", label: "Requirements matched to document", description: "Finding the passages that address each requirement." },
  { id: "compliance", label: "Compliance checks completed", description: "Checking each requirement against its matched passages." },
  { id: "verify", label: "Findings verified", description: "Re-reading the source text to confirm every finding and its evidence." },
];

/** Simulated duration of each stage, in milliseconds. */
export const VERIFAI_STAGE_DURATIONS: Record<VerifaiStageId, number> = {
  text: 1100,
  checklist: 900,
  match: 1500,
  compliance: 1700,
  verify: 1100,
};

export const VERIFAI_SEVERITY_LABEL = {
  major: "Major",
  minor: "Minor",
  review: "Need Review",
} as const;

/* ---------- Supplier Services Agreement v3.pdf (24 pages) ---------- */

const SUPPLIER_GDPR: VerifaiFinding[] = [
  {
    id: "sup-gdpr-03",
    requirementId: "REQ-03",
    severity: "major",
    status: "Not met",
    title: "Breach notification window is longer than 72 hours",
    description: "The agreement gives the supplier five business days to report a personal data breach. The checklist requires notification within 72 hours.",
    requirement: "Personal data breaches are notified within 72 hours.",
    evidence: {
      page: 14,
      section: "§9.2 Incident notification",
      quote: "The Supplier shall notify the Customer of any Personal Data Breach without undue delay and in any event within five (5) Business Days of becoming aware of it.",
    },
    suggestedFix: "In §9.2, replace \"five (5) Business Days\" with \"72 hours\" and require an initial notice while the investigation is ongoing.",
    why: "Five business days can stretch to seven or more calendar days. Controllers must report most breaches to the authority within 72 hours, so a later notice from the supplier leaves no time to comply.",
    clause: "9.2 The Supplier shall notify the Customer of any Personal Data Breach without undue delay and in any event within seventy-two (72) hours of becoming aware of it, providing the information then available and updating it as the investigation progresses.",
    comparison: { requirement: "Notify within 72 hours.", document: "Notify within five (5) Business Days.", gap: "Up to 4–5 extra days." },
    reportSection: "Breach notification (REQ-03), not met. §9.2 allows five business days; the requirement is 72 hours. Recommended change: amend §9.2 to 72 hours with an initial notice.",
    keywords: ["breach", "72 hour", "notif"],
  },
  {
    id: "sup-gdpr-07",
    requirementId: "REQ-07",
    severity: "major",
    status: "Not met",
    title: "Sub-processors can be added without approval",
    description: "The supplier may appoint sub-processors by publishing a list on its website. There is no prior written approval or right to object.",
    requirement: "Sub-processors require prior written approval.",
    evidence: {
      page: 16,
      section: "§10.4 Sub-processing",
      quote: "The Supplier may engage Sub-processors at its discretion and will maintain a current list of Sub-processors on its website.",
    },
    suggestedFix: "In §10.4, require prior written approval for new sub-processors, or at least 30 days' notice with a right to object.",
    why: "Without approval the customer cannot check where data goes or who handles it, which breaks its accountability duties.",
    clause: "10.4 The Supplier shall not engage any Sub-processor without the Customer's prior written approval. The Supplier shall give at least thirty (30) days' notice of any intended change, during which the Customer may object.",
    comparison: { requirement: "Prior written approval.", document: "Supplier's discretion; list published online.", gap: "No approval and no right to object." },
    reportSection: "Sub-processing (REQ-07), not met. §10.4 lets the supplier add sub-processors at its discretion. Recommended change: prior written approval with 30 days' notice.",
    keywords: ["sub-processor", "subprocessor", "sub processor"],
  },
  {
    id: "sup-gdpr-11",
    requirementId: "REQ-11",
    severity: "minor",
    status: "Partially met",
    title: "Audits are limited to once a year",
    description: "Audit rights exist but only once every 12 months and only through a third-party report.",
    requirement: "The customer may audit the supplier on reasonable notice.",
    evidence: {
      page: 18,
      section: "§12.1 Audit",
      quote: "The Customer may, no more than once in any twelve (12) month period, request a copy of the Supplier's most recent independent audit report.",
    },
    suggestedFix: "In §12.1, allow an additional audit after a breach or a regulator's request, on 30 days' notice.",
    why: "A yearly report may not cover the period of an incident, and regulators can ask for evidence at any time.",
    clause: "12.1 In addition to the annual audit report, the Customer may conduct an audit on thirty (30) days' notice following a Personal Data Breach or a request from a supervisory authority.",
    comparison: { requirement: "Audit on reasonable notice.", document: "Once a year, report only.", gap: "No audit after incidents." },
    reportSection: "Audit rights (REQ-11), partially met. §12.1 limits audits to one report per year. Recommended change: add incident-triggered audits.",
    keywords: ["audit"],
  },
  {
    id: "sup-gdpr-14",
    requirementId: "REQ-14",
    severity: "minor",
    status: "Partially met",
    title: "No deadline for deleting data after termination",
    description: "The agreement requires deletion at termination but does not say by when.",
    requirement: "Data is returned or deleted within 30 days of termination.",
    evidence: {
      page: 21,
      section: "§15.3 Effect of termination",
      quote: "Upon termination, the Supplier shall delete or return all Customer Personal Data in accordance with the Customer's instructions.",
    },
    suggestedFix: "In §15.3, add \"within thirty (30) days of termination\" and require written confirmation of deletion.",
    why: "Without a deadline, data can stay with the supplier indefinitely after the contract ends.",
    clause: "15.3 Within thirty (30) days of termination, the Supplier shall delete or return all Customer Personal Data, at the Customer's choice, and confirm the deletion in writing.",
    comparison: { requirement: "Within 30 days.", document: "No time limit.", gap: "Deadline missing." },
    reportSection: "Deletion after termination (REQ-14), partially met. §15.3 has no deadline. Recommended change: 30 days with written confirmation.",
    keywords: ["delet", "terminat", "retention"],
  },
  {
    id: "sup-gdpr-16",
    requirementId: "REQ-16",
    severity: "minor",
    status: "Partially met",
    title: "Encryption standard is not named",
    description: "Encryption at rest is required, but the standard and key length are not specified.",
    requirement: "Encryption at rest uses a named industry standard.",
    evidence: {
      page: 23,
      section: "Annex 2 · Security measures",
      quote: "Customer Personal Data is encrypted at rest using industry-standard encryption.",
    },
    suggestedFix: "In Annex 2, name the standard (for example AES-256) and say who manages the keys.",
    why: "\"Industry standard\" can't be checked in an audit; a named standard can.",
    clause: "Customer Personal Data is encrypted at rest using AES-256 or stronger, with keys managed in a dedicated key management service and rotated at least annually.",
    comparison: { requirement: "Named standard.", document: "\"Industry-standard encryption\".", gap: "Standard not named." },
    reportSection: "Encryption at rest (REQ-16), partially met. Annex 2 does not name a standard. Recommended change: specify AES-256 and key management.",
    keywords: ["encrypt"],
  },
  {
    id: "sup-gdpr-18",
    requirementId: "REQ-18",
    severity: "review",
    status: "Unclear",
    title: "Liability cap may also limit data protection claims",
    description: "The general cap applies to \"all claims\". It is unclear whether the exception in §17.4 covers data protection.",
    requirement: "Data protection claims are not limited by the general cap.",
    evidence: {
      page: 22,
      section: "§17.2 Limitation of liability",
      quote: "The Supplier's total liability for all claims shall not exceed the fees paid in the preceding twelve (12) months, except as set out in clause 17.4.",
    },
    suggestedFix: "Ask legal to confirm whether §17.4 covers breaches of data protection obligations; if not, add an explicit exception.",
    why: "The wording points to an exception in §17.4, but that clause only mentions confidentiality. A person should confirm whether data protection is meant to be included.",
    clause: "17.4 The limitation in clause 17.2 shall not apply to the Supplier's liability for breach of its data protection obligations under clause 9 and Schedule 3.",
    comparison: { requirement: "Data protection outside the cap.", document: "Cap covers \"all claims\" except §17.4 (confidentiality).", gap: "Data protection not clearly excluded." },
    reportSection: "Liability cap (REQ-18), needs review. §17.2 may also cap data protection claims. Recommended action: legal review of §17.4.",
    keywords: ["liabilit", "cap"],
  },
];

const SUPPLIER_PROCUREMENT: VerifaiFinding[] = [
  {
    id: "sup-pc-07",
    requirementId: "PC-07",
    severity: "major",
    status: "Not met",
    title: "No termination for convenience",
    description: "The agreement can only be ended for an unremedied material breach. Neither party can leave on notice.",
    requirement: "Either party may terminate for convenience with 90 days' notice.",
    evidence: {
      page: 20,
      section: "§15.1 Term and termination",
      quote: "This Agreement may be terminated only for material breach that remains unremedied for thirty (30) days after written notice.",
    },
    suggestedFix: "In §15.1, add a right for either party to terminate for convenience on 90 days' written notice.",
    why: "Without it the customer is locked in for the full term even if the service no longer fits, which procurement policy does not allow.",
    clause: "15.1A Either party may terminate this Agreement for convenience by giving the other party not less than ninety (90) days' written notice.",
    comparison: { requirement: "Termination on 90 days' notice.", document: "Termination for unremedied breach only.", gap: "No exit without breach." },
    reportSection: "Termination for convenience (PC-07), not met. §15.1 allows termination for breach only. Recommended change: add a 90-day convenience exit.",
    keywords: ["terminat", "convenience"],
  },
  {
    id: "sup-pc-04",
    requirementId: "PC-04",
    severity: "minor",
    status: "Not met",
    title: "Payment term is 45 days",
    description: "Invoices are payable within 45 days. The checklist requires payment within 30 days.",
    requirement: "Payment is due within 30 days of invoice.",
    evidence: {
      page: 8,
      section: "§6.3 Payment",
      quote: "Invoices are payable within forty-five (45) days of receipt.",
    },
    suggestedFix: "In §6.3, change \"forty-five (45) days\" to \"thirty (30) days\".",
    why: "A longer payment term than policy allows needs a finance exception, which delays approval.",
    clause: "6.3 Invoices are payable within thirty (30) days of receipt of a correct and undisputed invoice.",
    comparison: { requirement: "30 days.", document: "45 days.", gap: "15 days longer." },
    reportSection: "Payment terms (PC-04), not met. §6.3 sets 45 days. Recommended change: 30 days.",
    keywords: ["payment", "invoice"],
  },
  {
    id: "sup-pc-06",
    requirementId: "PC-06",
    severity: "minor",
    status: "Partially met",
    title: "Service credits are capped at 5%",
    description: "Service credits exist but are capped at 5% of the monthly fees, which gives little incentive to meet service levels.",
    requirement: "Service credits apply when service levels are missed.",
    evidence: {
      page: 11,
      section: "§7.4 Service credits",
      quote: "Service credits shall not exceed five percent (5%) of the monthly fees in any month.",
    },
    suggestedFix: "In §7.4, raise the cap to at least 15% and allow termination after three consecutive missed months.",
    why: "A 5% cap is below the level procurement normally accepts for critical services.",
    clause: "7.4 Service credits shall not exceed fifteen percent (15%) of the monthly fees in any month. Three consecutive months of missed service levels entitle the Customer to terminate.",
    comparison: { requirement: "Meaningful service credits.", document: "Capped at 5% per month.", gap: "Cap too low." },
    reportSection: "Service credits (PC-06), partially met. §7.4 caps credits at 5%. Recommended change: 15% cap and a termination right.",
    keywords: ["service credit", "service level"],
  },
  {
    id: "sup-pc-12",
    requirementId: "PC-12",
    severity: "review",
    status: "Unclear",
    title: "Unclear whether subcontracting needs approval",
    description: "§10.4 covers sub-processors of personal data only. It does not say whether other subcontractors need approval.",
    requirement: "Subcontracting requires prior approval.",
    evidence: {
      page: 16,
      section: "§10.4 Sub-processing",
      quote: "The Supplier may engage Sub-processors at its discretion and will maintain a current list of Sub-processors on its website.",
    },
    suggestedFix: "Confirm with legal whether a general subcontracting clause exists elsewhere; if not, add one requiring prior approval.",
    why: "The clause is written for personal data only, so a person needs to confirm how other subcontracting is controlled.",
    clause: "10.5 The Supplier shall not subcontract any of its obligations under this Agreement without the Customer's prior written approval.",
    comparison: { requirement: "Approval for any subcontracting.", document: "Covers sub-processors of personal data only.", gap: "Other subcontractors not addressed." },
    reportSection: "Subcontracting (PC-12), needs review. §10.4 only covers sub-processors. Recommended action: confirm or add a general subcontracting clause.",
    keywords: ["subcontract"],
  },
];

/* ---------- Information Security Policy 2026.pdf (38 pages) ---------- */

const SECURITY_GDPR: VerifaiFinding[] = [
  {
    id: "sec-gdpr-09",
    requirementId: "REQ-09",
    severity: "minor",
    status: "Not met",
    title: "Backups are tested once a year",
    description: "The policy requires backup restoration tests annually. The checklist requires tests at least twice a year.",
    requirement: "Backups are tested at least twice a year.",
    evidence: {
      page: 19,
      section: "§7.4 Backup and recovery",
      quote: "Restoration of backups is tested annually and the results are recorded by the IT Operations team.",
    },
    suggestedFix: "In §7.4, change \"annually\" to \"at least every six months\".",
    why: "With one test a year, a broken backup can go unnoticed for up to twelve months.",
    clause: "7.4 Restoration of backups is tested at least every six (6) months and the results are recorded by the IT Operations team.",
    comparison: { requirement: "Twice a year.", document: "Once a year.", gap: "One test missing each year." },
    reportSection: "Backup testing (REQ-09), not met. §7.4 tests restoration annually. Recommended change: every six months.",
    keywords: ["backup"],
  },
  {
    id: "sec-gdpr-12",
    requirementId: "REQ-12",
    severity: "review",
    status: "Unclear",
    title: "Patch time frames are not defined",
    description: "Critical vulnerabilities must be fixed \"as soon as practicable\". The policy gives no measurable time frame.",
    requirement: "Vulnerabilities are patched within agreed time frames.",
    evidence: {
      page: 22,
      section: "§8.2 Vulnerability management",
      quote: "Critical vulnerabilities are remediated as soon as practicable, taking business impact into account.",
    },
    suggestedFix: "Ask the policy owner whether an internal standard defines time frames; if not, add them (for example 14 days for critical issues).",
    why: "\"As soon as practicable\" may be backed by an internal standard that isn't in this document, so a person should confirm.",
    clause: "8.2 Critical vulnerabilities are remediated within fourteen (14) days and high vulnerabilities within thirty (30) days of identification.",
    comparison: { requirement: "Agreed time frames.", document: "\"As soon as practicable\".", gap: "No measurable deadline." },
    reportSection: "Patching (REQ-12), needs review. §8.2 has no time frame. Recommended action: confirm or add 14/30-day targets.",
    keywords: ["patch", "vulnerab"],
  },
];

/* ---------- Uploaded PDFs: a simulated contract scenario sized to the file ---------- */

function pageAt(pages: number, fraction: number) {
  return Math.min(pages, Math.max(1, Math.round(pages * fraction)));
}

function uploadFindings(doc: VerifaiDocument, checklist: "gdpr" | "procurement"): VerifaiFinding[] {
  if (checklist === "procurement") {
    return [
      {
        id: "up-pc-04",
        requirementId: "PC-04",
        severity: "minor",
        status: "Not met",
        title: "Payment term is 60 days",
        description: "The document sets a 60-day payment term. The checklist requires 30 days.",
        requirement: "Payment is due within 30 days of invoice.",
        evidence: { page: pageAt(doc.pages, 0.3), section: "Payment", quote: "Payment is due within sixty (60) days of the invoice date." },
        suggestedFix: "Change the payment term to thirty (30) days.",
        why: "A longer payment term than policy allows needs a finance exception.",
        clause: "Payment is due within thirty (30) days of the invoice date.",
        comparison: { requirement: "30 days.", document: "60 days.", gap: "30 days longer." },
        reportSection: "Payment terms (PC-04), not met. The document sets 60 days. Recommended change: 30 days.",
        keywords: ["payment", "invoice"],
      },
      {
        id: "up-pc-09",
        requirementId: "PC-09",
        severity: "major",
        status: "Not met",
        title: "Liability is capped at 3 months' fees",
        description: "The liability cap is three months of fees. The checklist requires at least twelve months.",
        requirement: "Liability is capped at no less than 12 months' fees.",
        evidence: { page: pageAt(doc.pages, 0.8), section: "Liability", quote: "Total liability shall not exceed the fees paid in the three (3) months preceding the claim." },
        suggestedFix: "Raise the cap to the fees paid in the preceding twelve (12) months.",
        why: "A three-month cap leaves most losses uncovered.",
        clause: "Total liability shall not exceed the fees paid in the twelve (12) months preceding the claim.",
        comparison: { requirement: "At least 12 months' fees.", document: "3 months' fees.", gap: "9 months short." },
        reportSection: "Liability cap (PC-09), not met. The cap is 3 months' fees. Recommended change: 12 months.",
        keywords: ["liabilit", "cap"],
      },
    ];
  }
  return [
    {
      id: "up-gdpr-03",
      requirementId: "REQ-03",
      severity: "major",
      status: "Not met",
      title: "No deadline for breach notification",
      description: "The document says incidents are reported \"within a reasonable time\". The checklist requires 72 hours.",
      requirement: "Personal data breaches are notified within 72 hours.",
      evidence: { page: pageAt(doc.pages, 0.4), section: "Security incidents", quote: "Security incidents will be reported to the customer within a reasonable time." },
      suggestedFix: "Replace \"within a reasonable time\" with \"within 72 hours of becoming aware\".",
      why: "Without a fixed deadline the customer may not be able to meet its own 72-hour reporting duty.",
      clause: "Personal data breaches will be reported to the customer without undue delay and within seventy-two (72) hours of becoming aware of them.",
      comparison: { requirement: "Within 72 hours.", document: "\"Within a reasonable time\".", gap: "No deadline." },
      reportSection: "Breach notification (REQ-03), not met. No deadline is given. Recommended change: 72 hours.",
      keywords: ["breach", "incident", "notif", "72 hour"],
    },
    {
      id: "up-gdpr-14",
      requirementId: "REQ-14",
      severity: "minor",
      status: "Partially met",
      title: "Retention after termination is open-ended",
      description: "Data is kept \"as long as required for business purposes\" with no limit after the contract ends.",
      requirement: "Data is returned or deleted within 30 days of termination.",
      evidence: { page: pageAt(doc.pages, 0.9), section: "Data retention", quote: "Customer data is retained for as long as required for business purposes." },
      suggestedFix: "Add deletion or return within thirty (30) days of termination, confirmed in writing.",
      why: "Open-ended retention keeps personal data longer than needed.",
      clause: "Within thirty (30) days of termination, all customer data is deleted or returned and the deletion is confirmed in writing.",
      comparison: { requirement: "Within 30 days.", document: "\"As long as required\".", gap: "No limit." },
      reportSection: "Deletion after termination (REQ-14), partially met. Retention has no limit. Recommended change: 30 days.",
      keywords: ["delet", "retain", "retention", "terminat"],
    },
  ];
}

/** Whether an uploaded PDF simulates a scanned (image-only) file. */
export function isScannedUpload(doc: VerifaiDocument) {
  return doc.template === "upload" && /scan/i.test(doc.name);
}

/** Findings a document produces against the GDPR-style requirements (used by manual and uploaded checklists too). */
export function gdprStyleFindings(doc: VerifaiDocument): VerifaiFinding[] {
  const byTemplate: Record<VerifaiDocumentTemplate, () => VerifaiFinding[]> = {
    supplier: () => SUPPLIER_GDPR,
    dpa: () => [],
    security: () => SECURITY_GDPR,
    upload: () => uploadFindings(doc, "gdpr"),
  };
  return byTemplate[doc.template]();
}

export function procurementFindings(doc: VerifaiDocument): VerifaiFinding[] | null {
  if (doc.template === "supplier") return SUPPLIER_PROCUREMENT;
  if (doc.template === "upload") return uploadFindings(doc, "procurement");
  // A policy or an addendum is not a commercial contract: most requirements can't be matched.
  return null;
}
