import { OllamaCorrector } from '@/lib/ollama';

describe('OllamaCorrector', () => {
  let corrector: OllamaCorrector;

  beforeEach(() => {
    corrector = new OllamaCorrector('http://localhost:11434');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should correct text successfully', async () => {
    const mockResponse = {
      message: {
        content: 'This is the corrected text.',
      },
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
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('This is the incorect text.'),
      })
    );
  });

  it('should handle API errors', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(
      corrector.correct({
        text: 'Some text',
      })
    ).rejects.toThrow('Ollama API error: 500 Internal Server Error');
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
    ).rejects.toThrow('Invalid response from Ollama API');
  });

  it('should use custom model and temperature', async () => {
    const mockResponse = {
      message: {
        content: 'Corrected text.',
      },
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await corrector.correct({
      text: 'Test text',
      model: 'custom-model',
      temperature: 0.5,
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.model).toBe('custom-model');
    expect(body.options.temperature).toBe(0.5);
  });
});
