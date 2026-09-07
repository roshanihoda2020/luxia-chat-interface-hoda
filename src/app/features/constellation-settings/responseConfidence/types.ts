export type ResponseConfidenceAction = "warning" | "error" | "block";

export type ResponseConfidencePreviewState = "normal" | "warning" | "error" | "block";

export interface ResponseConfidenceThreshold {
  value: number;
  action: ResponseConfidenceAction;
}

export interface ResponseConfidencePolicy {
  upper: ResponseConfidenceThreshold;
  lower: ResponseConfidenceThreshold;
  warningMessage: string;
  warningAppend: boolean;
  errorMessage: string;
  errorAppend: boolean;
  blockDefaultAnswer: string;
}

export interface ResponseConfidenceValidation {
  valid: boolean;
  upper?: string;
  lower?: string;
  comparison?: string;
}

export interface AppliedResponsePresentation {
  presentation: ResponseConfidencePreviewState;
  content: string;
  notice: string | null;
  showSources: boolean;
  footerVariant: "full" | "copy-only";
}
