import { NextRequest, NextResponse } from 'next/server';
import { UnifiedCorrector } from '@/lib/llm';
import { CorrectionRequest, CorrectionResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body: CorrectionRequest = await request.json();
    const { text, provider, model, temperature = 0, writingStyle } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Text is required',
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'mistral', 'openrouter'];
    if (!provider || !validProviders.includes(provider)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    // Get API key from appropriate header
    const headerName = `x-${provider}-key`;
    const apiKey = request.headers.get(headerName);
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: `${provider} API key is required in ${headerName.toUpperCase()} header`,
        } as CorrectionResponse,
        { status: 400 }
      );
    }

    // Perform correction using unified corrector
    const corrector = new UnifiedCorrector(provider, apiKey, model);
    const response = await corrector.correct({ text, model, temperature, writingStyle });
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
