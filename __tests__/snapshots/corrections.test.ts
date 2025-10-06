import { OllamaCorrector } from '@/lib/ollama';

describe('Correction Snapshots', () => {
  const testCases = [
    {
      name: 'English grammar error',
      input: 'I goes to the store yesterday.',
      expected: 'I went to the store yesterday.',
    },
    {
      name: 'English spelling error',
      input: 'The quik brown fox jumps over the lazi dog.',
      expected: 'The quick brown fox jumps over the lazy dog.',
    },
    {
      name: 'Turkish grammar error',
      input: 'Ben dün markete gidiyorum.',
      expected: 'Ben dün markete gittim.',
    },
    {
      name: 'Already correct text',
      input: 'This sentence is already correct.',
      expected: 'This sentence is already correct.',
    },
  ];

  it.each(testCases)(
    'should handle: $name',
    async ({ input, expected }) => {
      const corrector = new OllamaCorrector();

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: {
            content: expected,
          },
        }),
      } as Response);

      const result = await corrector.correct({ text: input });

      expect(result.result).toBe(expected);
      expect({
        input,
        output: result.result,
      }).toMatchSnapshot();
    }
  );
});
