import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getSystemPrompt } from "./prompts";
import type { CorrectionInput, CorrectionResult, Corrector, Provider } from "./types";

/**
 * Unified LLM Corrector using Vercel AI SDK
 * Supports multiple providers with a consistent interface
 */
export class UnifiedCorrector implements Corrector {
  private provider: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(provider: string, apiKey: string, defaultModel?: string) {
    if (!apiKey) {
      throw new Error(`API key is required for provider: ${provider}`);
    }
    this.provider = provider;
    this.apiKey = apiKey;

    // Set default models per provider
    switch (provider) {
      case "openai":
        this.defaultModel = defaultModel || "gpt-4o-mini";
        break;
      default:
        this.defaultModel = defaultModel || "gpt-4o-mini";
    }
  }

  async correct(input: CorrectionInput): Promise<CorrectionResult> {
    const model = input.model ?? this.defaultModel;
    const writingStyle = input.writingStyle ?? "grammar";
    const systemPrompt = getSystemPrompt(writingStyle);

    try {
      // Get the appropriate AI SDK provider
      const aiProvider = this.getAIProvider();
      const aiModel = aiProvider(model);

      // Use Vercel AI SDK's generateText for correction
      const { text } = await generateText({
        model: aiModel,
        system: systemPrompt,
        prompt: input.text,
        temperature: input.temperature ?? 0,
      });

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from LLM");
      }

      return { result: text.trim() };
    } catch (error) {
      console.error("Correction failed:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to correct text");
    }
  }

  /**
   * Get the appropriate AI SDK provider based on the provider string
   */
  private getAIProvider() {
    switch (this.provider) {
      case "openai":
        return createOpenAI({
          apiKey: this.apiKey,
        });
      case "anthropic":
        return createAnthropic({
          apiKey: this.apiKey,
        });
      case "mistral":
        return createMistral({
          apiKey: this.apiKey,
        });
      case "openrouter":
        // OpenRouter uses OpenAI-compatible API
        return createOpenAI({
          apiKey: this.apiKey,
          baseURL: "https://openrouter.ai/api/v1",
        });
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }
}

/**
 * Get the provider for a given model ID
 */
export function getProviderForModel(modelId: string): Provider {
  // OpenRouter models have specific patterns
  if (modelId.includes("/") && modelId.includes(":")) {
    return "openrouter";
  }

  // Claude models
  if (modelId.startsWith("claude-")) {
    return "anthropic";
  }

  // Mistral models
  if (modelId.startsWith("mistral-")) {
    return "mistral";
  }

  // Default to OpenAI for GPT models
  return "openai";
}

/**
 * Legacy OpenAI Corrector for backward compatibility
 * This wraps the UnifiedCorrector with OpenAI-specific defaults
 */
export class OpenAICorrector extends UnifiedCorrector {
  constructor(apiKey: string, defaultModel = "gpt-4o-mini") {
    super("openai", apiKey, defaultModel);
  }
}
