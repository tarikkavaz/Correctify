"use client";

import type { Provider } from "@/lib/types";
import { useLocale } from "@/lib/useLocale";
import { clearUsageHistory, getUsageStatsForPeriod } from "@/lib/usage-tracker";
import { BarChart3, Clock, DollarSign, Trash2, TrendingUp, X } from "lucide-react";
import { useState } from "react";

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageModal({ isOpen, onClose }: UsageModalProps) {
  const { messages } = useLocale();
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [refreshKey, setRefreshKey] = useState(0);

  const stats = getUsageStatsForPeriod(period);

  const handleClearHistory = () => {
    if (confirm(messages.usageModal.clearConfirm)) {
      clearUsageHistory();
      setRefreshKey((k) => k + 1); // Force refresh
    }
  };

  if (!isOpen) return null;

  const providerLabels: Record<Provider, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    mistral: "Mistral",
    openrouter: "OpenRouter",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: "var(--color-modal-backdrop)" }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-card-bg rounded-lg shadow-xl transition-colors" style={{ backgroundColor: "var(--card-bg-solid)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{messages.usageModal.title}</h2>
              <p className="text-xs text-text-muted mt-0.5">{messages.usageModal.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.usageModal.closeAriaLabel}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="px-6 pt-4 flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              type="button"
              key={days}
              onClick={() => setPeriod(days as 7 | 30 | 90)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === days
                  ? "bg-primary text-button-text"
                  : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
              }`}
            >
              {messages.usageModal.lastDays.replace("{days}", days.toString())}
            </button>
          ))}
        </div>

        {/* Body */}
        <div key={refreshKey} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-foreground/5 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{messages.usageModal.totalRequests}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalRequests}</p>
            </div>

            <div className="p-4 bg-foreground/5 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{messages.usageModal.successRate}</span>
              </div>
              <p className="text-2xl font-bold text-success-text">
                {stats.totalRequests > 0
                  ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
                  : 0}
                %
              </p>
            </div>

            <div className="p-4 bg-foreground/5 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{messages.usageModal.avgDuration}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalRequests > 0
                  ? (stats.totalDuration / stats.totalRequests / 1000).toFixed(1)
                  : 0}
                s
              </p>
            </div>

            <div className="p-4 bg-foreground/5 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{messages.usageModal.estCost}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${stats.estimatedCost.toFixed(3)}
              </p>
            </div>
          </div>

          {/* Provider Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{messages.usageModal.byProvider}</h3>
            {(
              Object.entries(stats.byProvider) as [Provider, (typeof stats.byProvider)[Provider]][]
            ).map(([provider, data]) => {
              if (data.requests === 0) return null;

              return (
                <div key={provider} className="p-4 bg-foreground/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground uppercase">
                      {providerLabels[provider]}
                    </span>
                    <span className="text-xs text-foreground/60">{data.requests} {messages.usageModal.requests}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-foreground/60">{messages.usageModal.tokens}</div>
                      <div className="font-semibold text-foreground mt-0.5">
                        {data.tokens.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground/60">{messages.usageModal.avgTime}</div>
                      <div className="font-semibold text-foreground mt-0.5">
                        {data.requests > 0 ? (data.duration / data.requests / 1000).toFixed(1) : 0}s
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground/60">{messages.usageModal.cost}</div>
                      <div className="font-semibold text-foreground mt-0.5">
                        ${data.cost.toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="p-4 bg-info-bg border border-info-border rounded-lg">
            <p className="text-xs text-info-text">
              <strong>{messages.usageModal.note}</strong> {messages.usageModal.noteText}
            </p>
          </div>

          {/* Clear History */}
          <div className="pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClearHistory}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-error-text hover:bg-error-bg rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {messages.usageModal.clearHistory}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-lg hover:bg-primary-hover transition-colors"
          >
            {messages.usageModal.close}
          </button>
        </div>
      </div>
    </div>
  );
}
