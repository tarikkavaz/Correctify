/**
 * Legacy OpenAI integration using OpenAI SDK directly
 * @deprecated Use UnifiedCorrector from './llm' instead
 * This file is kept for backward compatibility
 */

import OpenAI from 'openai';
import { Corrector, CorrectionInput, CorrectionResult } from './types';
import { getSystemPrompt } from './prompts';

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
    const writingStyle = input.writingStyle ?? 'grammar';
    const systemPrompt = getSystemPrompt(writingStyle);

    const res = await this.client.responses.create({
      model,
      instructions: systemPrompt,
      input: typeof input.text === 'string' ? input.text : String(input.text),
    });

    const out = res.output_text?.trim();
    if (!out) {
      throw new Error('Invalid response from OpenAI API');
    }

    return { result: out };
  }
}
