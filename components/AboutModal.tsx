"use client";

import { useLocale } from "@/lib/useLocale";
import packageJson from "@/package.json";
import { open } from "@tauri-apps/plugin-shell";
import { ExternalLink, X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const version = packageJson.version;
  const { messages } = useLocale();

  const handleOpenHomepage = async () => {
    try {
      await open("https://tarikkavaz.github.io/Correctify/");
    } catch (error) {
      console.error("Failed to open homepage URL:", error);
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
            <img src="/logo.png" alt="Correctify Logo" className="w-10 h-10" />
            <h2 className="text-xl font-semibold text-foreground">{messages.about.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label="Close about"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Subtitle */}
          <p className="text-center text-sm text-foreground/80">{messages.about.subtitle}</p>

          {/* Version Info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-foreground/80">
              {messages.about.version}{" "}
              <span className="font-semibold text-foreground">{version}</span>
            </p>
          </div>

          {/* Description */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-foreground/80 leading-relaxed text-center">
              {messages.about.description}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Features</h3>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Secure API key storage (OS-level encryption)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Multiple LLM providers (OpenAI, Anthropic, Mistral, OpenRouter)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Free models available via OpenRouter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Global keyboard shortcut for instant corrections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Multiple writing styles (Grammar, Formal, Informal, etc.)</span>
              </li>
            </ul>
          </div>

          {/* Homepage Link */}
          <div className="pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleOpenHomepage}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {messages.about.visitHomepage}
            </button>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border text-center">
            <p className="text-xs text-foreground/80">{messages.about.copyright}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
