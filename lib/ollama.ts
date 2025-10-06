import { Corrector, CorrectionInput, CorrectionResult } from './types';

const SYSTEM_PROMPT =
  'You are a writing assistant. Your job is to fix ALL spelling mistakes, grammar errors, and punctuation issues. This includes: repeated letters (e.g., "Hellllooo" → "Hello", "Worlddd" → "World"), misspelled words (e.g., "Thhis" → "This", "iz" → "is"), and typos. Be thorough and aggressive with corrections. IMPORTANT: The input uses markdown syntax - preserve the markdown formatting symbols (**bold**, *italic*, `code`, ```blocks```, lists, etc.) but fully correct all text content between them. DO NOT correct text inside code blocks (inline `code` or ```code blocks```). Return only the corrected text with preserved markdown formatting and no explanations.';

export class OllamaCorrector implements Corrector {
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    defaultModel: string = 'llama3.1:8b-instruct-q4'
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  async correct(input: CorrectionInput): Promise<CorrectionResult> {
    const { text, model = this.defaultModel, temperature = 0 } = input;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        stream: false,
        options: {
          temperature,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.message?.content) {
      throw new Error('Invalid response from Ollama API');
    }

    return {
      result: data.message.content.trim(),
    };
  }
}
