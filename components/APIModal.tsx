"use client";

import { useLocale } from "@/lib/useLocale";
import { open } from "@tauri-apps/plugin-shell";
import { Settings, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const { messages } = useLocale();

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(apiKey);
    onClose();
  };

  const handleClear = () => {
    setApiKey("");
  };

  const handleOpenAPIKey = async () => {
    try {
      await open("https://platform.openai.com/api-keys");
    } catch (error) {
      console.error("Failed to open API key URL:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: "var(--color-modal-backdrop)" }}
    >
      <div className="relative w-full max-w-md mx-4 bg-card-bg rounded-lg shadow-xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{messages.apiModal.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.apiModal.closeAriaLabel}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block text-sm font-medium text-foreground">
              {messages.apiModal.apiKeyLabel}
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={messages.apiModal.apiKeyPlaceholder}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors placeholder:text-muted-foreground"
            />
            <div className="flex items-start gap-2 text-xs text-foreground/60">
              <p className="flex-1">{messages.apiModal.securityNote}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAPIKey}
              className="inline-flex items-center text-xs text-primary hover:underline cursor-pointer"
            >
              {messages.apiModal.getKeyInstructions} {messages.apiModal.openAiPlatform} →
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
              >
                {messages.apiModal.clear}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
            >
              {messages.apiModal.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-lg hover:bg-primary-hover transition-colors"
            >
              {messages.apiModal.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
