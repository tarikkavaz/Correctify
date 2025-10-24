export type WritingStyle = 'grammar' | 'formal' | 'informal' | 'collaborative' | 'concise';

export interface CorrectionInput {
  text: string;
  model?: string;
  temperature?: number;
  writingStyle?: WritingStyle;
}

export interface CorrectionResult {
  result: string;
}

export interface Corrector {
  correct(input: CorrectionInput): Promise<CorrectionResult>;
}

export type Provider = 'openai';

export interface CorrectionRequest {
  text: string;
  provider: Provider;
  model?: string;
  temperature?: number;
  writingStyle?: WritingStyle;
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
