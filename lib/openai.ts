import OpenAI from 'openai';
import { Corrector, CorrectionInput, CorrectionResult } from './types';

const SYSTEM_PROMPT = `
You are a writing assistant. Fix ALL spelling mistakes, grammar errors, punctuation issues, and typos.

Rules:
1. Correct repeated letters (e.g., "Hellllooo" → "Hello").
2. Fix misspelled words (e.g., "Thhis" → "This").
3. Correct improper capitalization.
4. Preserve ALL markdown formatting (bold, italic, headings, lists, links, blockquotes, inline code, fenced code blocks).
5. NEVER alter text inside inline \`code\` or fenced \`\`\`code blocks\`\`\`.
6. Do not translate the text — always keep the original language of the input.
7. Be thorough and aggressive with corrections, but do not change meaning.
8. Output ONLY the corrected text with markdown formatting intact. Do not explain or add anything else.
`;

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
