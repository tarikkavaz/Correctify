import OpenAI from 'openai';
import { Corrector, CorrectionInput, CorrectionResult, WritingStyle } from './types';

const BASE_SYSTEM_PROMPT = `
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

const WRITING_STYLE_PROMPTS: Record<WritingStyle, string> = {
  grammar: BASE_SYSTEM_PROMPT,
  formal: `${BASE_SYSTEM_PROMPT}

Additional Instructions for Formal Tone:
- When rewriting, use a formal and professional tone.
- Avoid contractions (e.g., use "do not" instead of "don't").
- Use precise and polished language appropriate for business or academic contexts.
- Do not add unnecessary complexity or verbosity.`,
  informal: `${BASE_SYSTEM_PROMPT}

Additional Instructions for Informal Tone:
- When rewriting, use a relaxed and conversational tone.
- Use contractions and natural phrasing that feels friendly and human.
- Avoid stiff or overly professional expressions.
- Keep sentences clear and approachable.`,
  collaborative: `${BASE_SYSTEM_PROMPT}

Additional Instructions for Collaborative Tone:
- When rewriting, use an inclusive and friendly tone suitable for teamwork.
- Favor positive and cooperative language (e.g., "let's", "we can", "feel free to").
- Maintain professionalism while sounding approachable and open.
- Avoid harsh or overly direct phrasing.`,
  concise: `${BASE_SYSTEM_PROMPT}

Additional Instructions for Concise Style:
- When rewriting, aim for clarity and brevity.
- Remove unnecessary words and redundancy while keeping full meaning.
- Prefer short, direct sentences.
- Maintain a natural flow without sounding robotic or abrupt.`,
};

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
    const systemPrompt = WRITING_STYLE_PROMPTS[writingStyle];

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
