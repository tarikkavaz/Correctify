import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getModelById } from "./models";
import { getSystemPrompt } from "./prompts";
import { CorrectionError, type CorrectionInput, type CorrectionResult, type Corrector, type Provider, type RetryKind } from "./types";

const MAX_INPUT_CHARACTERS = 100_000;
const MAX_OUTPUT_TOKENS = 8_192;
const REQUEST_TIMEOUT_MS = 30_000;
const CODE_SEGMENT_PATTERN = /```[\s\S]*?```|`[^`\n]*`/g;

interface ProtectedCode {
  text: string;
  markers: Array<{ marker: string; source: string }>;
}

/**
 * Models must never receive executable Markdown as editable prose. We use opaque
 * markers and refuse a response that does not preserve them exactly.
 */
function protectCode(text: string): ProtectedCode {
  const markers: ProtectedCode["markers"] = [];
  const protectedText = text.replace(CODE_SEGMENT_PATTERN, (source) => {
    const marker = `[[CORRECTIFY_CODE_${markers.length}_DO_NOT_EDIT]]`;
    markers.push({ marker, source });
    return marker;
  });
  return { text: protectedText, markers };
}

function restoreCode(text: string, markers: ProtectedCode["markers"]): string | null {
  let restored = text;
  for (const { marker, source } of markers) {
    if (!restored.includes(marker)) return null;
    restored = restored.replace(marker, source);
  }
  // Do not trust a model to keep code syntax intact around a restored marker.
  // Reapply each original span in order, then fail closed if the structure changed.
  let index = 0;
  const enforced = restored.replace(CODE_SEGMENT_PATTERN, () => markers[index++]?.source ?? "");
  return index === markers.length ? enforced : null;
}

function classifyError(error: unknown): RetryKind {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("401") || message.includes("403") || message.includes("api key")) return "authentication";
  if (message.includes("400") || message.includes("invalid") || message.includes("context")) return "invalid-request";
  if (message.includes("429") || message.includes("capacity") || message.includes("rate limit")) return "capacity";
  if (message.includes("timeout") || message.includes("network") || message.includes("502") || message.includes("503")) return "transient";
  return "unknown";
}

export class UnifiedCorrector implements Corrector {
  constructor(private readonly provider: Provider, private readonly apiKey: string, private readonly defaultModel?: string) {
    if (!apiKey.trim()) throw new CorrectionError(`API key is required for provider: ${provider}`, "authentication");
  }

  async correct(input: CorrectionInput): Promise<CorrectionResult> {
    const model = input.model ?? this.defaultModel;
    const modelInfo = model && getModelById(model);
    if (!modelInfo || modelInfo.provider !== this.provider) throw new CorrectionError("The selected model is unavailable for this provider.", "invalid-request");
    if (!input.text.trim()) throw new CorrectionError("Text is required", "invalid-request");
    if (input.text.length > MAX_INPUT_CHARACTERS) throw new CorrectionError(`Text is too long. Limit corrections to ${MAX_INPUT_CHARACTERS.toLocaleString()} characters.`, "invalid-request");

    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
    try {
      const protectedCode = protectCode(input.text);
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await generateText({
          model: this.getAIProvider()(model),
          system: `${getSystemPrompt(input.writingStyle ?? "grammar", input.customRules, input.language)}${attempt ? "\nYour previous response altered a protected code marker. Output every CORRECTIFY_CODE marker exactly as received." : ""}`,
          prompt: protectedCode.text,
          ...(model.startsWith("gpt-5") ? {} : { temperature: input.temperature ?? 0 }),
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          maxRetries: 1,
          abortSignal: signal,
        });
        if (!response.text.trim()) throw new CorrectionError("The model returned an empty correction.", "transient");
        const restored = restoreCode(response.text.trim(), protectedCode.markers);
        if (restored !== null) {
          return { result: restored, usage: { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens, totalTokens: response.usage.totalTokens }, finishReason: response.finishReason, requestId: response.response.headers?.["x-request-id"] };
        }
      }
      throw new CorrectionError("The model could not preserve protected code. No correction was applied.", "transient");
    } catch (error) {
      if (error instanceof CorrectionError) throw error;
      if (signal.aborted && input.signal?.aborted) throw new CorrectionError("Correction cancelled.");
      if (timeout.aborted) throw new CorrectionError("Correction timed out. Please try again.", "transient");
      throw new CorrectionError(error instanceof Error ? error.message : "Failed to correct text", classifyError(error));
    }
  }

  private getAIProvider() {
    switch (this.provider) {
      case "openai": return createOpenAI({ apiKey: this.apiKey });
      case "anthropic": return createAnthropic({ apiKey: this.apiKey });
      case "mistral": return createMistral({ apiKey: this.apiKey });
      case "openrouter": return createOpenAI({ apiKey: this.apiKey, baseURL: "https://openrouter.ai/api/v1" });
    }
  }
}

export function getProviderForModel(modelId: string): Provider {
  const model = getModelById(modelId);
  if (!model) throw new CorrectionError("Unknown model.", "invalid-request");
  return model.provider;
}
