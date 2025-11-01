"use client";

import { useLocale } from "@/lib/useLocale";
import { isMacOS, isTauri } from "@/lib/utils";
import packageJson from "@/package.json";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bot,
  Command,
  CornerDownLeft,
  FileText,
  HelpCircle,
  KeyRound,
  Keyboard,
  Lightbulb,
  Palette,
  X,
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcutKey: string;
  shortcutModifier: string;
}

// Helper function to parse modifier string into key array
function parseModifierKeys(modifier: string, isMac: boolean): string[] {
  // modifier comes in format like "CmdOrCtrl+Shift", "CmdOrCtrl+Alt", etc.
  const parts = modifier.split("+");
  const keys: string[] = [];

  for (const part of parts) {
    if (part === "CmdOrCtrl") {
      keys.push(isMac ? "Cmd" : "Ctrl");
    } else if (part === "AltOrOption") {
      keys.push(isMac ? "Option" : "Alt");
    } else if (part === "Shift") {
      keys.push("Shift");
    } else if (part === "Alt") {
      keys.push(isMac ? "Option" : "Alt");
    } else {
      keys.push(part);
    }
  }

  return keys;
}

// Helper component to render Mac shortcuts with icons
function MacShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-0.5">
      {keys.map((key, index) => {
        const isLast = index === keys.length - 1;
        let keyElement;

        if (key === "Cmd") {
          keyElement = <Command className="w-3 h-3" />;
        } else if (key === "Enter") {
          keyElement = <CornerDownLeft className="w-3 h-3" />;
        } else if (key === "Shift") {
          keyElement = <span>⇧</span>;
        } else if (key === "Option") {
          keyElement = <span>⌥</span>;
        } else if (key === "Ctrl") {
          keyElement = <span>Ctrl</span>;
        } else if (key === "Alt") {
          keyElement = <span>Alt</span>;
        } else {
          keyElement = <span>{key}</span>;
        }

        return (
          <span key={index} className="flex items-center gap-0.5">
            {keyElement}
            {!isLast && <span className="text-xs">+</span>}
          </span>
        );
      })}
    </span>
  );
}

export default function HelpModal({ isOpen, onClose, shortcutKey, shortcutModifier }: HelpModalProps) {
  const { messages } = useLocale();
  const version = packageJson.version;
  const [isMac, setIsMac] = useState(false); // Default to false to avoid hydration mismatch

  useEffect(() => {
    // Detect OS only on client side to avoid hydration mismatch
    setIsMac(isMacOS());
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "var(--color-modal-backdrop)" }}
    >
      <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{messages.helpModal.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.helpModal.close}
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              {messages.helpModal.apiKeySetup}
            </h3>
            <div className="space-y-3 text-sm text-foreground/80">
              <p>
                {messages.helpModal.providersIntro}
              </p>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">{messages.helpModal.supportedProviders}</h4>
                <ul className="space-y-2 ml-2">
                  <li>
                    <strong>OpenAI</strong> - GPT-4o, GPT-4o Mini{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {messages.helpModal.getApiKey}
                    </a>
                  </li>
                  <li>
                    <strong>Anthropic</strong> - Claude 3.5 Sonnet, Claude 3.5 Haiku{" "}
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {messages.helpModal.getApiKey}
                    </a>
                  </li>
                  <li>
                    <strong>Mistral</strong> - Mistral Large, Mistral Small{" "}
                    <a
                      href="https://console.mistral.ai/api-keys/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {messages.helpModal.getApiKey}
                    </a>
                  </li>
                  <li>
                    <strong>OpenRouter</strong> - 4 FREE models (Llama 3.2 3B, Gemma 2 9B, Phi-3
                    Mini, Mistral 7B){" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {messages.helpModal.getFreeApiKey}
                    </a>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-success-bg border border-success-border rounded-lg mt-3 flex gap-2">
                <Lightbulb className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-success-text">
                  <strong>{messages.helpModal.tryForFreeTitle}</strong>
                  <p className="mt-1">
                    {messages.helpModal.tryForFreeText}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-info-bg border border-info-border rounded-lg mt-3 flex gap-2">
                <KeyRound className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-info-text">
                  <strong>{messages.helpModal.secureStorageTitle}</strong>
                  <p className="mt-1">
                    {messages.helpModal.secureStorageText}
                  </p>
                  <p className="mt-1 font-mono text-[10px] opacity-70">
                    {messages.helpModal.secureStoragePath}
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* How to Use Section */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {messages.helpModal.howToUse}
            </h3>
            <div className="space-y-4 text-sm text-foreground/80">
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  {messages.helpModal.inAppCorrection}
                </h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>{messages.helpModal.inAppStep1}</li>
                  <li>
                    {messages.helpModal.inAppStep2}{" "}
                    <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                      {isMac ? <MacShortcut keys={["Cmd", "Enter"]} /> : "Ctrl+Enter"}
                    </kbd>
                  </li>
                  <li>{messages.helpModal.inAppStep3}</li>
                  <li>{messages.helpModal.inAppStep4}</li>
                </ol>
              </div>

              {isTauri() && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    {messages.helpModal.globalShortcut}
                  </h4>
                  <p className="mb-2">{messages.helpModal.globalShortcutDescription}</p>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {messages.helpModal.withAutoCopyPaste}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                      <li>{messages.helpModal.autoCopyStep1}</li>
                      <li>
                        {messages.helpModal.autoCopyStep2}{" "}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                          {isMac ? (
                            <MacShortcut keys={[...parseModifierKeys(shortcutModifier, isMac), shortcutKey]} />
                          ) : (
                            parseModifierKeys(shortcutModifier, false).join("+") + "+" + shortcutKey
                          )}
                        </kbd>
                      </li>
                      <li>{messages.helpModal.autoCopyStep3}</li>
                    </ol>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      {messages.helpModal.withoutAutoCopyPaste}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                      <li>
                        {messages.helpModal.manualStep1}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                          {isMac ? <MacShortcut keys={["Cmd", "C"]} /> : "Ctrl+C"}
                        </kbd>
                        )
                      </li>
                      <li>
                        {messages.helpModal.manualStep2}{" "}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                          {isMac ? (
                            <MacShortcut keys={[...parseModifierKeys(shortcutModifier, isMac), shortcutKey]} />
                          ) : (
                            parseModifierKeys(shortcutModifier, false).join("+") + "+" + shortcutKey
                          )}
                        </kbd>
                      </li>
                      <li>{messages.helpModal.manualStep3}</li>
                      <li>
                        {messages.helpModal.manualStep4}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                          {isMac ? <MacShortcut keys={["Cmd", "V"]} /> : "Ctrl+V"}
                        </kbd>
                        )
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-info-bg border border-info-border rounded-lg mt-3 flex gap-2">
                    <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-info-text">
                      <strong>{messages.helpModal.globalShortcutTip}</strong>{" "}
                      {messages.helpModal.globalShortcutTipText}
                    </p>
                  </div>
                  <div className="p-3 bg-success-bg border border-success-border rounded-lg mt-3 flex gap-2">
                    <Keyboard className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-success-text">
                      <strong>{messages.helpModal.globalShortcutCustomization}</strong>{" "}
                      {messages.helpModal.globalShortcutCustomizationText}
                    </p>
                  </div>
                  <div className="p-3 bg-warning-bg border border-warning-border rounded-lg mt-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-warning-text flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-text">
                      <strong>{messages.helpModal.macosAccessibilityTitle}</strong> {messages.helpModal.macosAccessibilityText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Model Selection */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {messages.helpModal.modelSelection}
            </h3>
            <div className="space-y-3 text-sm text-foreground/80">
              <p>
                {messages.helpModal.modelsIntro}
              </p>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {messages.helpModal.paidModelsTitle}
                </h4>
                <ul className="space-y-1.5 ml-2">
                  <li>
                    <strong>GPT-5</strong> - {messages.helpModal.modelGpt5}
                  </li>
                  <li>
                    <strong>GPT-5 Mini</strong> - {messages.helpModal.modelGpt5Mini}
                  </li>
                  <li>
                    <strong>GPT-4o Mini</strong> - {messages.helpModal.modelGpt4oMini}
                  </li>
                  <li>
                    <strong>GPT-4o</strong> - {messages.helpModal.modelGpt4o}
                  </li>
                  <li>
                    <strong>GPT-4 Turbo</strong> - {messages.helpModal.modelGpt4Turbo}
                  </li>
                  <li>
                    <strong>GPT-3.5 Turbo</strong> - {messages.helpModal.modelGpt35Turbo}
                  </li>
                  <li>
                    <strong>Claude 3.5 Sonnet</strong> - {messages.helpModal.modelClaude35Sonnet}
                  </li>
                  <li>
                    <strong>Claude 3.5 Haiku</strong> - {messages.helpModal.modelClaude35Haiku}
                  </li>
                  <li>
                    <strong>Mistral Large</strong> - {messages.helpModal.modelMistralLarge}
                  </li>
                  <li>
                    <strong>Mistral Small</strong> - {messages.helpModal.modelMistralSmall}
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {messages.helpModal.freeModelsTitle}
                </h4>
                <ul className="space-y-1.5 ml-2">
                  <li>
                    <strong>Llama 3.2 3B</strong> - {messages.helpModal.modelLlama32}
                  </li>
                  <li>
                    <strong>Gemma 2 9B</strong> - {messages.helpModal.modelGemma2}
                  </li>
                  <li>
                    <strong>Phi-3 Mini</strong> - {messages.helpModal.modelPhi3}
                  </li>
                  <li>
                    <strong>Mistral 7B</strong> - {messages.helpModal.modelMistral7b}
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-info-bg border border-info-border rounded-lg flex gap-2">
                <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-info-text">
                  <strong>{messages.helpModal.smartFallbackTitle}</strong>
                  <p className="mt-1">
                    {messages.helpModal.smartFallbackText}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Writing Style Selection */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {messages.helpModal.writingStyleTitle}
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                {messages.helpModal.writingStyleIntro}
              </p>
              <ul className="space-y-2 ml-2">
                <li>
                  <strong className="text-foreground">{messages.helpModal.styleGrammarOnly}</strong> - {messages.helpModal.styleGrammarOnlyDesc}
                </li>
                <li>
                  <strong className="text-foreground">{messages.helpModal.styleFormal}</strong> - {messages.helpModal.styleFormalDesc}
                </li>
                <li>
                  <strong className="text-foreground">{messages.helpModal.styleInformal}</strong> - {messages.helpModal.styleInformalDesc}
                </li>
                <li>
                  <strong className="text-foreground">{messages.helpModal.styleCollaborative}</strong> - {messages.helpModal.styleCollaborativeDesc}
                </li>
                <li>
                  <strong className="text-foreground">{messages.helpModal.styleConcise}</strong> - {messages.helpModal.styleConciseDesc}
                </li>
              </ul>
              <div className="p-3 bg-info-bg border border-info-border rounded-lg mt-3 flex gap-2">
                <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <p className="text-xs text-info-text">
                  <strong>{messages.helpModal.writingStyleNote}</strong> {messages.helpModal.writingStyleNoteText}
                </p>
              </div>
            </div>
          </section>

          {/* Usage Tracking */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {messages.helpModal.usageStatsTitle}
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <p>
                {messages.helpModal.usageStatsIntro}
              </p>
              <ul className="space-y-1.5 ml-2">
                <li>{messages.helpModal.usageStatItem1}</li>
                <li>{messages.helpModal.usageStatItem2}</li>
                <li>{messages.helpModal.usageStatItem3}</li>
                <li>{messages.helpModal.usageStatItem4}</li>
                <li>{messages.helpModal.usageStatItem5}</li>
              </ul>
              <div className="p-3 bg-info-bg border border-info-border rounded-lg flex gap-2">
                <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-info-text">
                  <strong>{messages.helpModal.privacyTitle}</strong> {messages.helpModal.privacyText}
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              {messages.helpModal.keyboardShortcuts}
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <div className="flex justify-between items-center p-2 bg-foreground/5 rounded">
                <span>{messages.helpModal.shortcutSubmit}</span>
                <kbd className="px-2 py-1 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                  {isMac ? <MacShortcut keys={["Cmd", "Enter"]} /> : "Ctrl+Enter"}
                </kbd>
              </div>
              {isTauri() && (
                <div className="flex justify-between items-center p-2 bg-foreground/5 rounded">
                  <span>
                    {messages.helpModal.shortcutGlobal}{" "}
                    <span className="text-foreground/50 text-xs">{messages.helpModal.shortcutCustomizable}</span>
                  </span>
                  <kbd className="px-2 py-1 bg-foreground/10 rounded text-xs font-medium inline-flex items-center gap-1">
                    {isMac ? (
                      <MacShortcut keys={[...parseModifierKeys(shortcutModifier, isMac), shortcutKey]} />
                    ) : (
                      parseModifierKeys(shortcutModifier, false).join("+") + "+" + shortcutKey
                    )}
                  </kbd>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-button-text font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            {messages.helpModal.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
