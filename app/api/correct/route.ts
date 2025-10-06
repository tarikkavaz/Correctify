import { NextRequest, NextResponse } from 'next/server';
import { OllamaCorrector } from '@/lib/ollama';
import { OpenAICorrector } from '@/lib/openai';
import { CorrectionRequest, CorrectionResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body: CorrectionRequest = await request.json();
    const { text, provider, model, temperature = 0 } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Text is required',
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    if (!provider || !['ollama', 'openai'].includes(provider)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid provider. Must be "ollama" or "openai"',
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    let result: string;

    if (provider === 'ollama') {
      const corrector = new OllamaCorrector();
      const response = await corrector.correct({ text, model, temperature });
      result = response.result;
    } else if (provider === 'openai') {
      const apiKey = request.headers.get('x-openai-key');
      if (!apiKey) {
        return NextResponse.json(
          {
            ok: false,
            error: 'OpenAI API key is required in X-OPENAI-KEY header',
          } as CorrectionResponse,
          { status: 400 }
        );
      }

      const corrector = new OpenAICorrector(apiKey);
      const response = await corrector.correct({ text, model, temperature });
      result = response.result;
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unsupported provider',
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        ok: true,
        result,
        meta: {
          duration,
          model: model || (provider === 'ollama' ? 'llama3.1:8b-instruct-q4' : 'gpt-4o-mini'),
          provider,
        },
      } as CorrectionResponse,
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        meta: {
          duration,
        },
      } as CorrectionResponse,
      { status: 500 }
    );
  }
}
