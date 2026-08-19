export type WritingStyle = "grammar" | "formal" | "informal" | "collaborative" | "concise";
export type Provider = "openai" | "anthropic" | "mistral" | "openrouter";
export type RetryKind = "transient" | "capacity" | "authentication" | "invalid-request" | "unknown";

export interface CorrectionInput { text: string; model?: string; temperature?: number; writingStyle?: WritingStyle; customRules?: string; signal?: AbortSignal; }
export interface CorrectionUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; }
export interface CorrectionResult { result: string; usage: CorrectionUsage; finishReason?: string; requestId?: string; }
export interface Corrector { correct(input: CorrectionInput): Promise<CorrectionResult>; }

export class CorrectionError extends Error {
  constructor(message: string, public readonly retryKind: RetryKind = "unknown") { super(message); this.name = "CorrectionError"; }
}

export interface CorrectionRequest { text: string; provider: Provider; model?: string; temperature?: number; writingStyle?: WritingStyle; customRules?: string; }
export interface CorrectionResponse {
  ok: boolean; result?: string; error?: string;
  meta?: { duration?: number; model?: string; provider?: string; usage?: CorrectionUsage; finishReason?: string; requestId?: string; retryKind?: RetryKind; };
}
