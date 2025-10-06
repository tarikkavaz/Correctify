import { NextRequest, NextResponse } from 'next/server';
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

    if (!provider || provider !== 'openai') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid provider. Must be "openai"',
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    // Get API key
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

    // Perform correction
    const corrector = new OpenAICorrector(apiKey);
    const response = await corrector.correct({ text, model, temperature });
    const result = response.result;

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        ok: true,
        result,
        meta: {
          duration,
          model: model || 'gpt-4o-mini',
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
