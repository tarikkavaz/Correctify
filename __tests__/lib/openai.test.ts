import { OpenAICorrector } from '@/lib/openai';

describe('OpenAICorrector', () => {
  let corrector: OpenAICorrector;
  const mockApiKey = 'sk-test-key';

  beforeEach(() => {
    corrector = new OpenAICorrector(mockApiKey);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw error if API key is not provided', () => {
    expect(() => new OpenAICorrector('')).toThrow('OpenAI API key is required');
  });

  it('should correct text successfully', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'This is the corrected text.',
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await corrector.correct({
      text: 'This is the incorect text.',
    });

    expect(result.result).toBe('This is the corrected text.');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockApiKey}`,
        },
        body: expect.stringContaining('This is the incorect text.'),
      })
    );
  });

  it('should handle API errors', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: {
          message: 'Invalid API key',
        },
      }),
    } as Response);

    await expect(
      corrector.correct({
        text: 'Some text',
      })
    ).rejects.toThrow('OpenAI API error: 401 Invalid API key');
  });

  it('should handle invalid response format', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(
      corrector.correct({
        text: 'Some text',
      })
    ).rejects.toThrow('Invalid response from OpenAI API');
  });

  it('should use custom model and temperature', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Corrected text.',
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await corrector.correct({
      text: 'Test text',
      model: 'gpt-4',
      temperature: 0.7,
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.model).toBe('gpt-4');
    expect(body.temperature).toBe(0.7);
  });
});
