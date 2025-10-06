import OpenAI from 'openai';
import { Corrector, CorrectionInput, CorrectionResult } from './types';

const SYSTEM_PROMPT =
  'You are a writing assistant. Your job is to fix ALL spelling mistakes, grammar errors, and punctuation issues. This includes: repeated letters (e.g., "Hellllooo" → "Hello", "Worlddd" → "World"), misspelled words (e.g., "Thhis" → "This", "iz" → "is"), and typos. Be thorough and aggressive with corrections. IMPORTANT: The input uses markdown syntax - preserve the markdown formatting symbols (**bold**, *italic*, `code`, ```blocks```, lists, etc.) but fully correct all text content between them. DO NOT correct text inside code blocks (inline `code` or ```code blocks```). Return only the corrected text with preserved markdown formatting and no explanations.';

export class OpenAICorrector implements Corrector {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gpt-4o-mini') {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Safe in Tauri desktop app - API key stays local
    });
    this.defaultModel = defaultModel;
  }

  async correct(input: CorrectionInput): Promise<CorrectionResult> {
    const model = input.model ?? this.defaultModel;

    const res = await this.client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: typeof input.text === 'string' ? input.text : String(input.text),
    });

    const out = res.output_text?.trim();
    if (!out) {
      throw new Error('Invalid response from OpenAI API');
    }

    return { result: out };
  }
}
