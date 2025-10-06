export interface CorrectionInput {
  text: string;
  model?: string;
  temperature?: number;
}

export interface CorrectionResult {
  result: string;
}

export interface Corrector {
  correct(input: CorrectionInput): Promise<CorrectionResult>;
}

export type Provider = 'ollama' | 'openai';

export interface CorrectionRequest {
  text: string;
  provider: Provider;
  model?: string;
  temperature?: number;
}

export interface CorrectionResponse {
  ok: boolean;
  result?: string;
  error?: string;
  meta?: {
    duration?: number;
    model?: string;
    provider?: string;
  };
}
