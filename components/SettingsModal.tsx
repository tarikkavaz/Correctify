"use client";

import { deleteKey } from "@/lib/secure-keys";
import type { Provider } from "@/lib/types";
import { useLocale, type Locale } from "@/lib/useLocale";
import { isMacOS, isTauri } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-shell";
import { ChevronDown, Settings, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    apiKeys: Record<Provider, string>,
    autostartEnabled: boolean,
    soundEnabled: boolean,
    shortcutKey: string,
    shortcutModifier: string,
    autoPasteEnabled: boolean,
  ) => void;
  currentApiKeys: Record<Provider, string>;
  currentAutostartEnabled: boolean;
  currentSoundEnabled: boolean;
  currentShortcutKey: string;
  currentShortcutModifier: string;
  currentAutoPasteEnabled: boolean;
}

const API_KEY_CONFIG: Array<{
  provider: Provider;
  label: string;
  url: string;
  description: string;
}> = [
  {
    provider: "openai",
    label: "OpenAI API Key",
    url: "https://platform.openai.com/api-keys",
    description: "Get your API key from OpenAI Platform",
  },
  {
    provider: "anthropic",
    label: "Anthropic API Key",
    url: "https://console.anthropic.com/settings/keys",
    description: "Get your API key from Anthropic Console",
  },
  {
    provider: "mistral",
    label: "Mistral API Key",
    url: "https://console.mistral.ai/api-keys/",
    description: "Get your API key from Mistral Console",
  },
  {
    provider: "openrouter",
    label: "OpenRouter API Key",
    url: "https://openrouter.ai/keys",
    description: "Free account + API key unlock free models (no credit card)",
  },
];

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentApiKeys,
  currentAutostartEnabled,
  currentSoundEnabled,
  currentShortcutKey,
  currentShortcutModifier,
  currentAutoPasteEnabled,
}: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(currentApiKeys);
  const [autostartEnabled, setAutostartEnabled] = useState(currentAutostartEnabled);
  const [soundEnabled, setSoundEnabled] = useState(currentSoundEnabled);
  const [shortcutKey, setShortcutKey] = useState(currentShortcutKey);
  const [shortcutModifier, setShortcutModifier] = useState(currentShortcutModifier);
  const [autoPasteEnabled, setAutoPasteEnabled] = useState(currentAutoPasteEnabled);
  const [customRules, setCustomRules] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("custom-rules") || "";
    }
    return "";
  });
  const [isTauriApp, setIsTauriApp] = useState(false);
  const [activeTab, setActiveTab] = useState<"app-settings" | "rules" | "global-shortcut" | "api-keys">("app-settings");
  const [isModifierDropdownOpen, setIsModifierDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const modifierDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const { messages, locale, changeLocale } = useLocale();
  const [isMac, setIsMac] = useState(false); // Default to false to avoid hydration mismatch

  useEffect(() => {
    // Detect OS only on client side to avoid hydration mismatch
    setIsMac(isMacOS());
  }, []);

  // Get saved language or default to "system"
  const [selectedLanguage, setSelectedLanguage] = useState<Locale | "system">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-language");
      if (saved && (saved === "system" || ["en", "de", "fr", "tr"].includes(saved))) {
        return saved as Locale | "system";
      }
    }
    return "system";
  });

  useEffect(() => {
    setIsTauriApp(isTauri());

    // Initialize selectedLanguage based on current locale and localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-language");
      if (saved && (saved === "system" || ["en", "de", "fr", "tr"].includes(saved))) {
        setSelectedLanguage(saved as Locale | "system");
      } else {
        // If no saved preference, check if current locale matches system or is explicitly set
        const systemLang = navigator.language.toLowerCase();
        let systemLocale: Locale = "en";
        if (systemLang.startsWith("de")) systemLocale = "de";
        else if (systemLang.startsWith("fr")) systemLocale = "fr";
        else if (systemLang.startsWith("tr")) systemLocale = "tr";

        // If current locale matches system, set to "system", otherwise set to current locale
        if (locale === systemLocale) {
          setSelectedLanguage("system");
        } else {
          setSelectedLanguage(locale);
        }
      }
    }
  }, [locale]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modifierDropdownRef.current && !modifierDropdownRef.current.contains(event.target as Node)) {
        setIsModifierDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setApiKeys(currentApiKeys);
    setAutostartEnabled(currentAutostartEnabled);
    setSoundEnabled(currentSoundEnabled);
    setShortcutKey(currentShortcutKey);
    setShortcutModifier(currentShortcutModifier);
    setAutoPasteEnabled(currentAutoPasteEnabled);
  }, [
    currentApiKeys,
    currentAutostartEnabled,
    currentSoundEnabled,
    currentShortcutKey,
    currentShortcutModifier,
    currentAutoPasteEnabled,
  ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Save custom rules to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("custom-rules", customRules);
    }
    onSave(apiKeys, autostartEnabled, soundEnabled, shortcutKey, shortcutModifier, autoPasteEnabled);
    onClose();
  };

  const handleApiKeyChange = (provider: Provider, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleClearApiKey = (provider: Provider) => {
    setApiKeys((prev) => ({ ...prev, [provider]: "" }));
  };

  const handleRemoveStoredKey = async (provider: Provider) => {
    if (!isTauri()) return;

    if (
      confirm(
        `Are you sure you want to remove the stored ${provider} API key? You will need to re-enter it.`,
      )
    ) {
      try {
        await deleteKey(`${provider}-api-key`);
        setApiKeys((prev) => ({ ...prev, [provider]: "" }));
        alert("API key removed successfully from secure storage.");
      } catch (error) {
        console.error("Failed to remove API key:", error);
        alert("Failed to remove API key. Please try again.");
      }
    }
  };

  const handleOpenAPIKey = async (url: string) => {
    try {
      await open(url);
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
      <div className="relative w-full max-w-[550px] mx-4 bg-card-bg rounded-lg shadow-xl transition-colors" style={{ backgroundColor: "var(--card-bg-solid)" }}>
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

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("app-settings")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "app-settings"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {messages.apiModal.appSettingsTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "rules"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {messages.apiModal.rulesTab.title}
          </button>
          {isTauriApp && (
            <button
              type="button"
              onClick={() => setActiveTab("global-shortcut")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "global-shortcut"
                  ? "text-primary border-b-2 border-primary"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {messages.apiModal.globalShortcutTab}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("api-keys")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "api-keys"
                ? "text-primary border-b-2 border-primary"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {messages.apiModal.apiKeysTab}
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* API Keys Tab */}
          {activeTab === "api-keys" && (
            <div className="space-y-4">
              {API_KEY_CONFIG.map((config) => (
                <div
                  key={config.provider}
                  className="space-y-2 pb-4 border-b border-border last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`apiKey-${config.provider}`}
                      className="block text-sm font-medium text-foreground"
                    >
                      {config.label}
                      {config.provider === "openrouter" && (
                        <span className="ml-2 text-xs text-success-text font-semibold">
                          (FREE MODELS - KEY REQUIRED)
                        </span>
                      )}
                    </label>
                    {apiKeys[config.provider] && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey(config.provider)}
                        className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    id={`apiKey-${config.provider}`}
                    type="password"
                    value={apiKeys[config.provider]}
                    onChange={(e) => handleApiKeyChange(config.provider, e.target.value)}
                    placeholder={`Enter your ${config.label}`}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors text-sm placeholder:text-muted-foreground"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenAPIKey(config.url)}
                      className="inline-flex items-center text-xs text-primary hover:underline cursor-pointer"
                    >
                      {config.description} →
                    </button>
                    {isTauriApp && apiKeys[config.provider] && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStoredKey(config.provider)}
                        className="inline-flex items-center text-xs text-error-text hover:text-error-text hover:underline cursor-pointer"
                      >
                        Remove from storage
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 text-xs text-foreground/60 pt-2">
                <p className="flex-1">{messages.apiModal.securityNote}</p>
              </div>
            </div>
          )}

          {/* App Settings Tab */}
          {activeTab === "app-settings" && (
            <div className="space-y-6">
              {/* Language Selector */}
              <div className="space-y-2">
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-foreground"
                >
                  {messages.apiModal.languageLabel}
                </label>
                <div className="relative" ref={languageDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 hover:text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
                  >
                    <span className="flex-1 text-left">
                      {selectedLanguage === "system"
                        ? messages.apiModal.languageSystem
                        : selectedLanguage === "en"
                        ? "English"
                        : selectedLanguage === "de"
                        ? "Deutsch"
                        : selectedLanguage === "fr"
                        ? "Français"
                        : "Türkçe"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform flex-shrink-0 ${isLanguageDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isLanguageDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card-bg border border-border rounded-lg shadow-lg z-10" style={{ backgroundColor: "var(--card-bg-solid)" }}>
                      {(["system", "en", "de", "fr", "tr"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={async () => {
                            setSelectedLanguage(lang);
                            setIsLanguageDropdownOpen(false);
                            if (lang !== "system") {
                              changeLocale(lang);
                              localStorage.setItem("app-language", lang);
                              localStorage.removeItem("dev-locale"); // Remove old dev-locale if exists

                              // Sync locale to Rust backend
                              if (isTauriApp) {
                                try {
                                  const { invoke } = await import("@tauri-apps/api/core");
                                  await invoke("set_locale", { locale: lang });
                                } catch (err) {
                                  console.error("Failed to sync locale:", err);
                                }
                              }
                            } else {
                              localStorage.setItem("app-language", "system");
                              localStorage.removeItem("dev-locale");

                              // Sync system locale to Rust backend
                              if (isTauriApp) {
                                try {
                                  const { invoke } = await import("@tauri-apps/api/core");
                                  const systemLang = navigator.language.toLowerCase();
                                  const systemLocale = systemLang.startsWith("de") ? "de" :
                                                       systemLang.startsWith("fr") ? "fr" :
                                                       systemLang.startsWith("tr") ? "tr" : "en";
                                  await invoke("set_locale", { locale: systemLocale });
                                } catch (err) {
                                  console.error("Failed to sync locale:", err);
                                }
                              }

                              // Reload to use system language
                              window.location.reload();
                            }
                          }}
                          className={`w-full text-left px-3 py-2.5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            selectedLanguage === lang
                              ? "bg-primary text-button-text"
                              : "text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {lang === "system"
                              ? messages.apiModal.languageSystem
                              : lang === "en"
                              ? "English"
                              : lang === "de"
                              ? "Deutsch"
                              : lang === "fr"
                              ? "Français"
                              : "Türkçe"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Autostart and Sound Notifications Side by Side (Desktop Only) */}
              {isTauriApp && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Autostart Option */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="autostart"
                        type="checkbox"
                        checked={autostartEnabled}
                        onChange={(e) => setAutostartEnabled(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="autostart"
                          className="block text-sm font-medium text-foreground cursor-pointer"
                        >
                          {messages.apiModal.autostartLabel}
                        </label>
                        <p className="text-xs text-foreground/60 mt-1">
                          {messages.apiModal.autostartDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sound Notifications */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="soundEnabled"
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="soundEnabled"
                          className="block text-sm font-medium text-foreground cursor-pointer"
                        >
                          {messages.apiModal.soundLabel}
                        </label>
                        <p className="text-xs text-foreground/60 mt-1">
                          {messages.apiModal.soundDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* Auto Copy/Paste (Desktop Only) */}
              {isTauriApp && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      id="autoPaste"
                      type="checkbox"
                      checked={autoPasteEnabled}
                      onChange={(e) => setAutoPasteEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="autoPaste"
                        className="block text-sm font-medium text-foreground cursor-pointer"
                      >
                        {messages.apiModal.autoPasteLabel}
                      </label>
                      <p className="text-xs text-foreground/60 mt-1">
                        {messages.apiModal.autoPasteDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-foreground/80">
                  {messages.apiModal.rulesTab.description}
                </p>

                <div className="p-3 bg-info-bg border border-info-border rounded-lg">
                  <p className="text-xs text-info-text">
                    <strong>{messages.apiModal.rulesTab.sampleTitle}</strong> {messages.apiModal.rulesTab.sampleText}
                  </p>
                </div>

                <label
                  htmlFor="customRules"
                  className="block text-sm font-medium text-foreground"
                >
                  {messages.apiModal.rulesTab.label}
                </label>
                <textarea
                  id="customRules"
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder={messages.apiModal.rulesTab.placeholder}
                  rows={8}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors text-sm placeholder:text-muted-foreground resize-none"
                />
                <p className="text-xs text-foreground/60">
                  {messages.apiModal.rulesTab.info}
                </p>
              </div>
            </div>
          )}

          {/* Global Shortcut Tab */}
          {activeTab === "global-shortcut" && isTauriApp && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label
                  htmlFor="shortcutModifier"
                  className="block text-sm font-medium text-foreground"
                >
                  {messages.apiModal.globalShortcutLabel}
                </label>

                {/* Modifier Dropdown */}
                <div className="space-y-2">
                  <label htmlFor="shortcutModifier" className="text-xs text-foreground/60">
                    {messages.apiModal.shortcutModifierLabel}
                  </label>
                  <div className="relative" ref={modifierDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModifierDropdownOpen(!isModifierDropdownOpen)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 hover:text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
                    >
                      <span className="flex-1 text-left">
                        {shortcutModifier === "CmdOrCtrl+Shift"
                          ? (isMac ? (
                              <>
                                Cmd+Shift <span className="text-foreground/60">(⌘+⇧)</span>
                              </>
                            ) : "Ctrl+Shift")
                          : shortcutModifier === "CmdOrCtrl+Alt"
                          ? (isMac ? (
                              <>
                                Cmd+Option <span className="text-foreground/60">(⌘+⌥)</span>
                              </>
                            ) : "Ctrl+Alt")
                          : shortcutModifier === "AltOrOption+Shift"
                          ? (isMac ? (
                              <>
                                Option+Shift <span className="text-foreground/60">(⌥+⇧)</span>
                              </>
                            ) : "Alt+Shift")
                          : (isMac ? (
                              <>
                                Cmd+Option+Shift <span className="text-foreground/60">(⌘+⌥+⇧)</span>
                              </>
                            ) : "Ctrl+Alt+Shift")}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${isModifierDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isModifierDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card-bg border border-border rounded-lg shadow-lg z-10" style={{ backgroundColor: "var(--card-bg-solid)" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShortcutModifier("CmdOrCtrl+Shift");
                            setIsModifierDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 transition-colors first:rounded-t-lg ${
                            shortcutModifier === "CmdOrCtrl+Shift"
                              ? "bg-primary text-button-text"
                              : "text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {isMac ? (
                              <>
                                Cmd+Shift <span className="text-foreground/60">(⌘+⇧)</span>
                              </>
                            ) : "Ctrl+Shift"}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShortcutModifier("CmdOrCtrl+Alt");
                            setIsModifierDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 transition-colors ${
                            shortcutModifier === "CmdOrCtrl+Alt"
                              ? "bg-primary text-button-text"
                              : "text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {isMac ? (
                              <>
                                Cmd+Option <span className="text-foreground/60">(⌘+⌥)</span>
                              </>
                            ) : "Ctrl+Alt"}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShortcutModifier("AltOrOption+Shift");
                            setIsModifierDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 transition-colors ${
                            shortcutModifier === "AltOrOption+Shift"
                              ? "bg-primary text-button-text"
                              : "text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {isMac ? (
                              <>
                                Option+Shift <span className="text-foreground/60">(⌥+⇧)</span>
                              </>
                            ) : "Alt+Shift"}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShortcutModifier("CmdOrCtrl+Alt+Shift");
                            setIsModifierDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 transition-colors last:rounded-b-lg ${
                            shortcutModifier === "CmdOrCtrl+Alt+Shift"
                              ? "bg-primary text-button-text"
                              : "text-foreground hover:bg-foreground/5"
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {isMac ? (
                              <>
                                Cmd+Option+Shift <span className="text-foreground/60">(⌘+⌥+⇧)</span>
                              </>
                            ) : "Ctrl+Alt+Shift"}
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Input and Preview in one row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Key Input */}
                  <div className="space-y-2">
                    <label htmlFor="shortcutKey" className="text-xs text-foreground/60">
                      {messages.apiModal.shortcutKeyLabel}
                    </label>
                    <input
                      id="shortcutKey"
                      type="text"
                      value={shortcutKey}
                      onChange={(e) => setShortcutKey(e.target.value.slice(-1).toUpperCase())}
                      maxLength={1}
                      placeholder="]"
                      className="w-full text-center px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors uppercase placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <label className="text-xs text-foreground/60">{messages.apiModal.shortcutPreview}</label>
                    <div className="px-3 py-2 bg-foreground/5 border border-border rounded-lg text-sm font-mono text-foreground flex items-center justify-center h-[42px]">
                      {shortcutModifier === "CmdOrCtrl+Shift"
                        ? (isMac
                            ? `⌘ + ⇧ + ${shortcutKey}`
                            : `Ctrl + Shift + ${shortcutKey}`)
                        : shortcutModifier === "CmdOrCtrl+Alt"
                        ? (isMac
                            ? `⌘ + ⌥ + ${shortcutKey}`
                            : `Ctrl + Alt + ${shortcutKey}`)
                        : shortcutModifier === "AltOrOption+Shift"
                        ? (isMac
                            ? `⌥ + ⇧ + ${shortcutKey}`
                            : `Alt + Shift + ${shortcutKey}`)
                        : (isMac
                            ? `⌘ + ⌥ + ⇧ + ${shortcutKey}`
                            : `Ctrl + Alt + Shift + ${shortcutKey}`)
                      }
                    </div>
                  </div>
                </div>

                <p className="text-xs text-foreground/60">
                  {messages.apiModal.shortcutDescription}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3">
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
