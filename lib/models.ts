import type { Provider } from "./types";

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  category: "paid" | "free";
  description: string;
  contextWindow: number;
  costPer1MToken?: { input: number; output: number };
  isFallback?: boolean;
  badge?: "Recommended" | "Fastest" | "Best quality" | "Free";
}

/** A deliberately small catalog of models we support and test. */
export const MODELS = [
  { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", provider: "openai", category: "paid", badge: "Fastest", description: "Fastest and lowest-cost OpenAI option", contextWindow: 400_000, costPer1MToken: { input: 0.2, output: 1.25 } },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "openai", category: "paid", badge: "Recommended", description: "Higher-quality OpenAI corrections", contextWindow: 400_000, costPer1MToken: { input: 0.75, output: 4.5 } },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "openai", category: "paid", description: "Premium OpenAI corrections for demanding writing", contextWindow: 1_050_000, costPer1MToken: { input: 2.5, output: 15 } },
  { id: "gpt-5.5", name: "GPT-5.5", provider: "openai", category: "paid", badge: "Best quality", description: "OpenAI flagship for the highest-quality corrections", contextWindow: 1_000_000, costPer1MToken: { input: 5, output: 30 } },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "anthropic", category: "paid", description: "Fast Anthropic alternative", contextWindow: 200_000, costPer1MToken: { input: 1, output: 5 } },
  { id: "ministral-3b-2512", name: "Ministral 3B", provider: "mistral", category: "paid", description: "Low-cost Mistral correction", contextWindow: 256_000, costPer1MToken: { input: 0.1, output: 0.1 } },
  { id: "openrouter/free", name: "OpenRouter Free", provider: "openrouter", category: "free", badge: "Free", description: "A variable free model selected by OpenRouter", contextWindow: 32_000, isFallback: true },
] as const satisfies readonly ModelInfo[];

export type ModelId = (typeof MODELS)[number]["id"];

export function getModelsByCategory(category: ModelInfo["category"]): ModelInfo[] {
  return MODELS.filter((model) => model.category === category);
}

export function getModelById(id: string): ModelInfo | undefined {
  return MODELS.find((model) => model.id === id);
}

export function getDefaultModel(): ModelInfo {
  return getModelById("gpt-5.4-mini") as ModelInfo;
}

export function getRecommendedModel(hasKeys: Record<Provider, boolean>): ModelInfo | undefined {
  const available = getAvailableModels(hasKeys);
  return available.find((model) => model.badge === "Recommended") ?? available[0];
}

export function getFallbackModel(): ModelInfo {
  return MODELS.find((model) => "isFallback" in model && model.isFallback) as ModelInfo;
}

export function getAvailableModels(hasKeys: Record<Provider, boolean>): ModelInfo[] {
  return MODELS.filter((model) => hasKeys[model.provider]);
}
