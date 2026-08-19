export type WritingStyle = "grammar" | "formal" | "informal" | "collaborative" | "concise";
export type Provider = "openai" | "anthropic" | "mistral" | "openrouter";
export type RetryKind = "transient" | "capacity" | "authentication" | "invalid-request" | "unknown";
export type DetectedLanguage = "en" | "tr" | "de" | "fr" | "mixed" | "unknown";
export type LanguagePreference = "auto" | DetectedLanguage;

export interface ReviewEdit {
  id: string;
  original: string;
  corrected: string;
  accepted: boolean;
  start: number;
  end: number;
}

export interface CorrectionReview {
  original: string;
  corrected: string;
  edits: ReviewEdit[];
  language: DetectedLanguage;
}

export interface Preset {
  id: string;
  name: string;
  writingStyle: WritingStyle;
  customRules: string;
  language: LanguagePreference;
  createdAt: number;
  updatedAt: number;
}

export interface CorrectionInput { text: string; model?: string; temperature?: number; writingStyle?: WritingStyle; customRules?: string; language?: DetectedLanguage; signal?: AbortSignal; }
export interface CorrectionUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; }
export interface CorrectionResult { result: string; usage: CorrectionUsage; finishReason?: string; requestId?: string; }
export interface Corrector { correct(input: CorrectionInput): Promise<CorrectionResult>; }

export class CorrectionError extends Error {
  constructor(message: string, public readonly retryKind: RetryKind = "unknown") { super(message); this.name = "CorrectionError"; }
}

export interface CorrectionRequest { text: string; provider: Provider; model?: string; temperature?: number; writingStyle?: WritingStyle; customRules?: string; language?: DetectedLanguage; }
export interface CorrectionResponse {
  ok: boolean; result?: string; error?: string;
  meta?: { duration?: number; model?: string; provider?: string; usage?: CorrectionUsage; finishReason?: string; requestId?: string; retryKind?: RetryKind; };
}
