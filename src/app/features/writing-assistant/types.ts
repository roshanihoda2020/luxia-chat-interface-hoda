export type WritingAssistantActionId =
  | "translate"
  | "rewrite"
  | "make-formal"
  | "bulletize"
  | "summarize"
  | "match-reference";

export type WritingAssistantAction = {
  id: WritingAssistantActionId;
  label: string;
  query: string;
};

export const WRITING_ASSISTANT_ACTIONS: WritingAssistantAction[] = [
  { id: "translate", label: "Translate", query: "Translate this text" },
  { id: "rewrite", label: "Rewrite", query: "Rewrite this text" },
  { id: "make-formal", label: "Make Formal", query: "Make this text more formal" },
  { id: "bulletize", label: "Bulletize", query: "Convert this to bullet points" },
  { id: "summarize", label: "Summarize", query: "Summarize this text" },
  {
    id: "match-reference",
    label: "Match Reference",
    query: "Adapt this text to a reference document tone and style",
  },
];

export type EditorTextSelection = {
  text: string;
  range: Range;
};

export type ImportedDocumentInfo = {
  name: string;
  sizeBytes: number;
  format: "docx" | "txt" | "md";
};

export const WRITING_ASSISTANT_ERRORS = {
  selectAndQuery: "Please select text and enter a query",
  invalidResponse: "Invalid response from AI service",
  selectLanguage: "Choose a target language to translate",
  selectReference: "Choose a reference document to match",
  unsupportedReference: "Supported reference formats: .docx, .txt, .md",
} as const;

export const DOCX_MESSAGES = {
  extensionOnly: "Only .docx, .txt, and .md files are supported.",
  sizeLimit: "File size must be less than 10 MB.",
  formatsHint: ".docx, .txt, .md · Max 10 MB",
} as const;
