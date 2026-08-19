import { getModelById } from "./models";
import type { Provider } from "./types";
import type { DetectedLanguage, WritingStyle } from "./types";

export interface UsageEntry {
  timestamp: number;
  provider: Provider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
  writingStyle?: WritingStyle;
  language?: DetectedLanguage;
  detectedEdits?: number;
  acceptedEdits?: number;
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number; // milliseconds
  totalTokens: number;
  estimatedCost: number; // in USD
  byProvider: Record<
    Provider,
    {
      requests: number;
      tokens: number;
      duration: number;
      cost: number;
    }
  >;
}

const STORAGE_KEY = "correctify_usage_history_v2";
const MAX_ENTRIES = 1000; // Keep last 1000 entries

/**
 * Get all usage entries from localStorage
 */
export function getUsageHistory(): UsageEntry[] {
  // Check if we're in the browser
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return (JSON.parse(data) as UsageEntry[]).map((entry) => ({ ...entry, writingStyle: entry.writingStyle ?? "grammar", language: entry.language ?? "unknown", detectedEdits: entry.detectedEdits ?? 0, acceptedEdits: entry.acceptedEdits ?? 0 }));
  } catch (error) {
    console.error("Failed to load usage history:", error);
    return [];
  }
}

export function exportUsageHistory(): string {
  const headers = ["timestamp", "provider", "model", "style", "language", "duration_ms", "input_tokens", "output_tokens", "estimated_edits", "accepted_edits", "success", "error"];
  const rows = getUsageHistory().map((entry) => [new Date(entry.timestamp).toISOString(), entry.provider, entry.model, entry.writingStyle ?? "grammar", entry.language ?? "unknown", entry.duration, entry.inputTokens ?? 0, entry.outputTokens ?? 0, entry.detectedEdits ?? 0, entry.acceptedEdits ?? 0, entry.success, entry.error ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Add a new usage entry
 */
export function trackUsage(entry: UsageEntry): void {
  // Check if we're in the browser
  if (typeof window === "undefined") return;

  try {
    const history = getUsageHistory();
    history.push(entry);

    // Keep only the last MAX_ENTRIES
    const trimmed = history.slice(-MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to track usage:", error);
  }
}

/**
 * Clear all usage history
 */
export function clearUsageHistory(): void {
  // Check if we're in the browser
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear usage history:", error);
  }
}

/**
 * Calculate usage statistics
 */
export function calculateUsageStats(entries: UsageEntry[] = getUsageHistory()): UsageStats {
  const stats: UsageStats = {
    totalRequests: entries.length,
    successfulRequests: entries.filter((e) => e.success).length,
    failedRequests: entries.filter((e) => !e.success).length,
    totalDuration: 0,
    totalTokens: 0,
    estimatedCost: 0,
    byProvider: {
      openai: { requests: 0, tokens: 0, duration: 0, cost: 0 },
      anthropic: { requests: 0, tokens: 0, duration: 0, cost: 0 },
      mistral: { requests: 0, tokens: 0, duration: 0, cost: 0 },
      openrouter: { requests: 0, tokens: 0, duration: 0, cost: 0 },
    },
  };

  for (const entry of entries) {
    stats.totalDuration += entry.duration;
    const totalTokens = (entry.inputTokens || 0) + (entry.outputTokens || 0);
    stats.totalTokens += totalTokens;

    // Calculate cost based on model
    const modelInfo = getModelById(entry.model);
    if (modelInfo?.costPer1MToken) {
      const cost = ((entry.inputTokens || 0) / 1_000_000) * modelInfo.costPer1MToken.input
        + ((entry.outputTokens || 0) / 1_000_000) * modelInfo.costPer1MToken.output;
      stats.estimatedCost += cost;
      stats.byProvider[entry.provider].cost += cost;
    }

    // Provider stats
    stats.byProvider[entry.provider].requests++;
    stats.byProvider[entry.provider].tokens += totalTokens;
    stats.byProvider[entry.provider].duration += entry.duration;
  }

  return stats;
}

/**
 * Get usage stats for a specific time period
 */
export function getUsageStatsForPeriod(days: number): UsageStats {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const entries = getUsageHistory().filter((e) => e.timestamp >= cutoff);
  return calculateUsageStats(entries);
}
