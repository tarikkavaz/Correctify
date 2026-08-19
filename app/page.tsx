"use client";

import AboutModal from "@/components/AboutModal";
import DraggableHeader from "@/components/DraggableHeader";
import HelpModal from "@/components/HelpModal";
import OnboardingModal from "@/components/OnboardingModal";
import ReviewPanel from "@/components/ReviewPanel";
import SettingsModal from "@/components/SettingsModal";
import UpdateModal from "@/components/UpdateModal";
import UsageModal from "@/components/UsageModal";
import { UnifiedCorrector, getProviderForModel } from "@/lib/llm";
import { MODELS, type ModelInfo, getAvailableModels, getModelById, getRecommendedModel } from "@/lib/models";
import { deleteKey, getKey, getKeys, migrateFromLocalStorage, setKey } from "@/lib/secure-keys";
import { CorrectionError, type CorrectionResponse, type Provider, type WritingStyle } from "@/lib/types";
import { createReview, detectLanguage } from "@/lib/review";
import { getPresets, savePreset } from "@/lib/presets";
import type { CorrectionReview, DetectedLanguage, LanguagePreference, Preset } from "@/lib/types";
import { checkForUpdates, installUpdate, type UpdateInfo } from "@/lib/updater";
import { trackUsage } from "@/lib/usage-tracker";
import { useLocale } from "@/lib/useLocale";
import { useTheme } from "@/lib/useTheme";
import { isMacOS, isTauri } from "@/lib/utils";
import { ChevronDown, Command, CornerDownLeft, Lightbulb, Plus } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

export default function HomePage() {
  const { messages } = useLocale();

  // Helper function to get translated model description
  const getModelDescription = (modelId: string, defaultDescription?: string): string => {
    const translated = messages.home.modelDescriptions?.[modelId as keyof typeof messages.home.modelDescriptions];
    return translated || defaultDescription || "";
  };
  const [isMac, setIsMac] = useState(false); // Default to false to avoid hydration mismatch
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [review, setReview] = useState<CorrectionReview | null>(null);
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>("auto");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    openai: "",
    anthropic: "",
    mistral: "",
    openrouter: "",
  });
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true); // Default: enabled
  const [shortcutKey, setShortcutKey] = useState("]"); // Default: closing bracket
  const [shortcutModifier, setShortcutModifier] = useState("CmdOrCtrl+Shift"); // Default: Cmd+Shift / Ctrl+Shift
  const [autoPasteEnabled, setAutoPasteEnabled] = useState(false); // Default: disabled
  const [model, setModel] = useState<string>("gpt-5.4-mini");
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>("grammar");
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<CorrectionResponse["meta"] | null>(null);
  const [showFallbackOption, setShowFallbackOption] = useState(false);
  const [fallbackModelId, setFallbackModelId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  // Update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<"downloading" | "installing" | null>(null);
  const [showGlobalShortcutInfo, setShowGlobalShortcutInfo] = useState(false);
  const [isInfoFadingOut, setIsInfoFadingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const detectedLanguage = useMemo(() => detectLanguage(inputText), [inputText]);
  const activeLanguage = languagePreference === "auto" ? detectedLanguage : languagePreference;

  useEffect(() => {
    // Detect OS only on client side to avoid hydration mismatch
    setIsMac(isMacOS());
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlistenShortcut: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;
    const initializeApp = async () => {
      // Migrate from localStorage to secure storage (one-time, Tauri only)
      if (isTauri()) {
        await migrateFromLocalStorage();
      }

      // Load all API keys from secure storage
      const loadedKeys = await getKeys();

      setApiKeys(loadedKeys);
      setPresets(getPresets());

      // Compute available models based on API keys
      const hasKeys: Record<Provider, boolean> = {
        openai: !!loadedKeys.openai,
        anthropic: !!loadedKeys.anthropic,
        mistral: !!loadedKeys.mistral,
        openrouter: !!loadedKeys.openrouter,
      };
      const available = getAvailableModels(hasKeys);
      setAvailableModels(available);

      // Load saved model or default to first available
      const savedModel = localStorage.getItem("selected-model");
      let modelToSet = savedModel;
      if (savedModel && available.some((m) => m.id === savedModel)) {
        setModel(savedModel);
      } else if (available.length > 0) {
        modelToSet = getRecommendedModel(hasKeys)?.id || available[0].id;
        setModel(modelToSet);
        localStorage.setItem("selected-model", modelToSet);
      } else {
        modelToSet = "gpt-5.4-mini";
        setModel(modelToSet);
        localStorage.setItem("selected-model", modelToSet);
      }

      const savedStyle = localStorage.getItem("writing-style") as WritingStyle | null;
      let styleToSet: WritingStyle = "grammar";
      if (
        savedStyle &&
        ["grammar", "formal", "informal", "collaborative", "concise"].includes(savedStyle)
      ) {
        styleToSet = savedStyle;
        setWritingStyle(savedStyle);
      }

      // Sync model and style to Rust backend
      if (isTauri() && (modelToSet || styleToSet)) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("set_correction_settings", {
            model: modelToSet || null,
            style: styleToSet || null,
          });
        } catch (err) {
          console.error("Failed to sync correction settings:", err);
        }
      }

      // Sync locale to Rust backend
      if (isTauri()) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const savedLocale = localStorage.getItem("app-language") || "system";
          // Map "system" to detected locale or default to "en"
          const localeToSync = savedLocale === "system" ?
            (navigator.language.toLowerCase().startsWith("de") ? "de" :
             navigator.language.toLowerCase().startsWith("fr") ? "fr" :
             navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en") :
            (savedLocale === "en" || savedLocale === "de" || savedLocale === "fr" || savedLocale === "tr" ? savedLocale : "en");
          await invoke("set_locale", { locale: localeToSync });
        } catch (err) {
          console.error("Failed to sync locale:", err);
        }
      }

      const savedAutostart = localStorage.getItem("autostart-enabled");
      if (savedAutostart === "true") {
        setAutostartEnabled(true);
      }

      const savedSoundEnabled = localStorage.getItem("sound-enabled");
      if (savedSoundEnabled !== null) {
        setSoundEnabled(savedSoundEnabled === "true");
      }

      const savedShortcutKey = localStorage.getItem("shortcut-key");
      if (savedShortcutKey) {
        setShortcutKey(savedShortcutKey);
      }

      const savedShortcutModifier = localStorage.getItem("shortcut-modifier");
      if (savedShortcutModifier) {
        setShortcutModifier(savedShortcutModifier);
      }

      const savedAutoPasteEnabled = localStorage.getItem("auto-paste-enabled");
      if (savedAutoPasteEnabled !== null) {
        setAutoPasteEnabled(savedAutoPasteEnabled === "true");
      }

      // Check if running in Tauri (client-side only)
      setShowGlobalShortcutInfo(isTauri());
      if (isTauri() && !localStorage.getItem("correctify_onboarding_v1") && !Object.values(loadedKeys).some(Boolean)) {
        setIsOnboardingOpen(true);
      }

      // Listen for global shortcut event from Rust backend
      if (isTauri()) {
        const [{ listen }, { invoke }] = await Promise.all([
          import("@tauri-apps/api/event"),
          import("@tauri-apps/api/core"),
        ]);
        const stopSettingsListener = await listen("open-settings", () => setIsSettingsModalOpen(true));
        if (disposed) stopSettingsListener(); else unlistenSettings = stopSettingsListener;

        console.log("Setting up global shortcut event listener...");

        // Initialize Rust settings from localStorage
        const currentSoundEnabled = localStorage.getItem("sound-enabled") !== "false"; // Default: true
        const currentShortcutKey = localStorage.getItem("shortcut-key") || "]";
        const currentShortcutModifier = localStorage.getItem("shortcut-modifier") || "CmdOrCtrl+Shift";
        const currentAutoPasteEnabled = localStorage.getItem("auto-paste-enabled") === "true"; // Default: false

        try {
          await invoke("set_sound_enabled", { enabled: currentSoundEnabled });
          console.log("Sound enabled set to:", currentSoundEnabled);

          await invoke("set_auto_paste_enabled", { enabled: currentAutoPasteEnabled });
          console.log("Auto-paste enabled set to:", currentAutoPasteEnabled);

          await invoke("update_shortcut", {
            newKey: currentShortcutKey,
            newModifier: currentShortcutModifier
          });
          console.log("Shortcut set to:", `${currentShortcutModifier}+${currentShortcutKey}`);
        } catch (err) {
          console.error("Failed to initialize settings:", err);
        }

        // Notification permission is intentionally requested only when a user enables notification feedback.

        const unlisten = await listen(
          "correct-clipboard-text",
          async (event: { payload: string }) => {
            const textToCorrect = event.payload;
            console.log("=== Received text to correct from global shortcut ===");
            console.log("Text length:", textToCorrect.length);
            console.log("Text preview:", textToCorrect.substring(0, 100));

            // Check if API key is available
            // Get current model and its provider
            const savedModel = localStorage.getItem("selected-model");
            const currentModel = getModelById(savedModel || "")?.id || "gpt-5.4-mini";
            if (savedModel !== currentModel) localStorage.setItem("selected-model", currentModel);
            const provider = getProviderForModel(currentModel);

            // Check if API key for this provider is configured
            const currentApiKey = await getKey(`${provider}-api-key`);
            if (!currentApiKey) {
              console.error("No API key available - please configure in settings");
              // Send error notification
              try {
                const { sendNotification } = await import("@tauri-apps/plugin-notification");
                const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
                await sendNotification({
                  title: "Correctify Error",
                  body: `Please configure your ${providerName} API key in settings first!`,
                });
                console.log("Error notification sent for missing API key");
              } catch (err) {
                console.error("Failed to send error notification:", err);
              }
              return;
            }

            try {
              console.log("Starting correction...");
              const correctionStartTime = Date.now();

              // Perform correction
              const currentStyle =
                (localStorage.getItem("writing-style") as WritingStyle) || "grammar";
              const customRules = localStorage.getItem("custom-rules") || "";
              const corrector = new UnifiedCorrector(provider, currentApiKey, currentModel);
              const result = await corrector.correct({
                text: textToCorrect,
                writingStyle: currentStyle,
                customRules: customRules.trim() || undefined,
              });

              const correctionDuration = Date.now() - correctionStartTime;
              console.log("Correction result:", result.result.substring(0, 100));
              console.log("Correction duration:", correctionDuration, "ms");

              // Get auto-paste setting
              const autoPasteEnabled = localStorage.getItem("auto-paste-enabled") === "true";

              // Send corrected text back to Rust with model, duration, and auto-paste flag
              await invoke("handle_corrected_text", {
                text: result.result,
                model: currentModel,
                duration: correctionDuration,
                autoPaste: autoPasteEnabled,
              });
              console.log("=== Correction completed successfully ===");
            } catch (err) {
              console.error("Failed to correct text:", err);
              // Send error notification
              try {
                const { sendNotification } = await import("@tauri-apps/plugin-notification");
                await sendNotification({
                  title: "Correctify Error",
                  body: `Failed to correct text: ${err instanceof Error ? err.message : "Unknown error"}`,
                });
                console.log("Error notification sent for correction failure");
              } catch (notifErr) {
                console.error("Failed to send error notification:", notifErr);
              }
            }
          },
        );

        if (disposed) {
          unlisten();
        } else {
          unlistenShortcut = unlisten;
        }
      }
    };

    initializeApp().catch((err) => {
      console.error("Failed to initialize app:", err);
    });

    // Check for updates (Tauri only, silent check on startup)
    if (isTauri()) {
      checkForUpdates(
        true, // silent
        (update) => {
          // Show modal when update is available
          if (update) {
            setUpdateInfo(update);
            setIsUpdateModalOpen(true);
          }
        },
      ).catch((err) => {
        console.error("Update check failed:", err);
      });
    }

    return () => {
      disposed = true;
      unlistenShortcut?.();
      unlistenSettings?.();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleModelChange = async (newModelId: string) => {
    setModel(newModelId);
    localStorage.setItem("selected-model", newModelId);
    setIsModelDropdownOpen(false);

    // Sync to Rust backend
    if (isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_correction_settings", {
          model: newModelId,
          style: null,
        });
      } catch (err) {
        console.error("Failed to sync model setting:", err);
      }
    }
  };

  const handleStyleChange = async (newStyle: WritingStyle) => {
    setWritingStyle(newStyle);
    localStorage.setItem("writing-style", newStyle);
    setIsStyleDropdownOpen(false);

    // Sync to Rust backend
    if (isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_correction_settings", {
          model: null,
          style: newStyle,
        });
      } catch (err) {
        console.error("Failed to sync style setting:", err);
      }
    }
  };

  // Group available models by category
  const paidModels = availableModels.filter((m) => m.category === "paid");
  const freeModels = availableModels.filter((m) => m.category === "free");

  const styleOptions: Array<{ value: WritingStyle; label: string; description: string }> = [
    {
      value: "grammar",
      label: messages.home.styleOptions.grammar.label,
      description: messages.home.styleOptions.grammar.description
    },
    {
      value: "formal",
      label: messages.home.styleOptions.formal.label,
      description: messages.home.styleOptions.formal.description
    },
    {
      value: "informal",
      label: messages.home.styleOptions.informal.label,
      description: messages.home.styleOptions.informal.description
    },
    {
      value: "collaborative",
      label: messages.home.styleOptions.collaborative.label,
      description: messages.home.styleOptions.collaborative.description,
    },
    {
      value: "concise",
      label: messages.home.styleOptions.concise.label,
      description: messages.home.styleOptions.concise.description
    },
  ];

  const handleOpenAbout = () => {
    setIsAboutModalOpen(true);
  };

  const handleReload = () => {
    if (isTauri()) {
      try {
        window.location.reload();
      } catch (err) {
        console.error("Failed to reload window:", err);
      }
    }
  };

  const handleQuit = async () => {
    if (isTauri()) {
      try {
        const { exit } = await import("@tauri-apps/plugin-process");
        await exit(0);
      } catch (err) {
        console.error("Failed to quit app:", err);
      }
    }
  };

  const handleSaveApiKey = async (
    newApiKeys: Record<Provider, string>,
    newAutostartEnabled: boolean,
    newSoundEnabled: boolean,
    newShortcutKey: string,
    newShortcutModifier: string,
    newAutoPasteEnabled: boolean,
  ) => {
    // Update state
    setApiKeys(newApiKeys);
    setAutostartEnabled(newAutostartEnabled);
    setSoundEnabled(newSoundEnabled);
    setShortcutKey(newShortcutKey);
    setShortcutModifier(newShortcutModifier);
    setAutoPasteEnabled(newAutoPasteEnabled);

    // Save all API keys to secure storage
    try {
      for (const provider of Object.keys(newApiKeys) as Provider[]) {
        const keyValue = newApiKeys[provider];
        const keyName = `${provider}-api-key`;

        if (keyValue && keyValue.trim().length > 0) {
          await setKey(keyName, keyValue);
        } else {
          // Remove key if empty
          try {
            await deleteKey(keyName);
          } catch (err) {
            // Ignore if key doesn't exist
          }
        }
      }

      // Recompute available models
      const hasKeys: Record<Provider, boolean> = {
        openai: !!newApiKeys.openai,
        anthropic: !!newApiKeys.anthropic,
        mistral: !!newApiKeys.mistral,
        openrouter: !!newApiKeys.openrouter,
      };
      const available = getAvailableModels(hasKeys);
      setAvailableModels(available);

      // Reset model if current model is no longer available
      if (!available.some((m) => m.id === model) && available.length > 0) {
        const newModel = getRecommendedModel(hasKeys)?.id || available[0].id;
        setModel(newModel);
        localStorage.setItem("selected-model", newModel);

        // Sync to Rust backend
        if (isTauri()) {
          try {
            const { invoke } = await import("@tauri-apps/api/core");
            await invoke("set_correction_settings", {
              model: newModel,
              style: null,
            });
          } catch (err) {
            console.error("Failed to sync model setting:", err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to save API keys:", error);
      alert("Failed to save API keys securely. Please try again.");
      return;
    }

    localStorage.setItem("autostart-enabled", newAutostartEnabled.toString());
    localStorage.setItem("sound-enabled", newSoundEnabled.toString());
    localStorage.setItem("shortcut-key", newShortcutKey);
    localStorage.setItem("shortcut-modifier", newShortcutModifier);
    localStorage.setItem("auto-paste-enabled", newAutoPasteEnabled.toString());

    // Handle settings via Tauri
    if (isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");

        // Update sound setting in Rust
        await invoke("set_sound_enabled", { enabled: newSoundEnabled });
        console.log("Sound enabled updated to:", newSoundEnabled);

        // Update auto-paste setting in Rust
        await invoke("set_auto_paste_enabled", { enabled: newAutoPasteEnabled });
        console.log("Auto-paste enabled updated to:", newAutoPasteEnabled);

        // Update shortcut if changed
        if (newShortcutKey !== shortcutKey || newShortcutModifier !== shortcutModifier) {
          await invoke("update_shortcut", {
            newKey: newShortcutKey,
            newModifier: newShortcutModifier
          });
          console.log(`Shortcut updated to: ${newShortcutModifier}+${newShortcutKey}`);
        }

        // Handle autostart
        const { enable, disable, isEnabled } = await import("@tauri-apps/plugin-autostart");
        const currentlyEnabled = await isEnabled();

        if (newAutostartEnabled && !currentlyEnabled) {
          await enable();
          console.log("Autostart enabled");
        } else if (!newAutostartEnabled && currentlyEnabled) {
          await disable();
          console.log("Autostart disabled");
        }
      } catch (err) {
        console.error("Failed to update settings:", err);
      }
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!inputText.trim()) {
      setError("Please enter some text to correct");
      return;
    }

    if (!isTauri()) {
      setError("Corrections and API keys are available only in the Correctify desktop app.");
      return;
    }

    // Get provider and API key for selected model
    const provider = getProviderForModel(model);
    const modelApiKey = apiKeys[provider];

    if (!modelApiKey || !modelApiKey.trim()) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      setError(`Please add your ${providerName} API key in Settings`);
      setIsSettingsModalOpen(true);
      return;
    }

    // Fade out the global shortcut info on first use
    if (showGlobalShortcutInfo && !isInfoFadingOut) {
      setIsInfoFadingOut(true);
      setTimeout(() => {
        setShowGlobalShortcutInfo(false);
      }, 500); // Match the CSS transition duration
    }

    setIsLoading(true);
    setError("");
    setOutputText("");
    setReview(null);
    setMeta(null);

    const startTime = Date.now();

    try {
      {
        const { invoke } = await import("@tauri-apps/api/core");

        // Play processing sound
        try {
          await invoke("play_sound_in_app", { soundType: "processing" });
        } catch (err) {
          console.error("Failed to play processing sound:", err);
        }

        const customRules = localStorage.getItem("custom-rules") || "";
        const corrector = new UnifiedCorrector(provider, modelApiKey, model);
        const result = await corrector.correct({
          text: inputText,
          writingStyle: writingStyle,
          customRules: customRules.trim() || undefined,
          language: activeLanguage,
        });

        const duration = Date.now() - startTime;

        setOutputText(result.result);
        const nextReview = createReview(inputText, result.result);
        setReview(nextReview);
        setMeta({
          duration,
          model: model,
          provider: provider,
          usage: result.usage,
          finishReason: result.finishReason,
          requestId: result.requestId,
        });

        // Track usage
        trackUsage({
          timestamp: Date.now(),
          provider,
          model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          duration,
          success: true,
          writingStyle,
          language: activeLanguage,
          detectedEdits: nextReview.edits.length,
          acceptedEdits: nextReview.edits.length,
        });

        // Play completed sound
        try {
          await invoke("play_sound_in_app", { soundType: "completed" });
        } catch (err) {
          console.error("Failed to play completed sound:", err);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect to the server";
      setError(errorMsg);

      // Track failed usage
      trackUsage({
        timestamp: Date.now(),
        provider,
        model,
        inputTokens: 0,
        outputTokens: 0,
        duration: Date.now() - startTime,
        success: false,
          error: errorMsg,
          writingStyle,
          language: activeLanguage,
      });

      // Check if a free fallback model is available
      const retryKind = err instanceof CorrectionError ? err.retryKind : "unknown";
      const freeModels = availableModels.filter((m) => m.category === "free");
      if (["transient", "capacity"].includes(retryKind) && freeModels.length > 0 && model !== freeModels[0].id) {
        setFallbackModelId(freeModels[0].id);
        setShowFallbackOption(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryWithFallback = async () => {
    if (fallbackModelId) {
      setModel(fallbackModelId);
      localStorage.setItem("selected-model", fallbackModelId);
      setShowFallbackOption(false);
      setFallbackModelId(null);

      // Sync to Rust backend
      if (isTauri()) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("set_correction_settings", {
            model: fallbackModelId,
            style: null,
          });
        } catch (err) {
          console.error("Failed to sync model setting:", err);
        }
      }

      // Trigger correction with the fallback model
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyReview = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSavePreset = () => {
    const name = window.prompt("Preset name");
    if (!name?.trim()) return;
    const now = Date.now();
    const preset: Preset = { id: crypto.randomUUID(), name: name.trim(), writingStyle, customRules: localStorage.getItem("custom-rules") || "", language: languagePreference, createdAt: now, updatedAt: now };
    setPresets(savePreset(preset));
    setSelectedPresetId(preset.id);
  };

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setWritingStyle(preset.writingStyle);
    setLanguagePreference(preset.language);
    localStorage.setItem("writing-style", preset.writingStyle);
    localStorage.setItem("custom-rules", preset.customRules);
  };

  const handleOnboarding = async (provider: Provider, key: string) => {
    const modelForProvider = provider === "openai" ? getModelById("gpt-5.4-mini") : MODELS.find((item) => item.provider === provider);
    if (!modelForProvider) return false;
    try {
      await new UnifiedCorrector(provider, key, modelForProvider.id).correct({ text: "Correctify test.", writingStyle: "grammar" });
      await setKey(`${provider}-api-key`, key);
      const nextKeys = { ...apiKeys, [provider]: key };
      setApiKeys(nextKeys);
      setAvailableModels(getAvailableModels({ openai: !!nextKeys.openai, anthropic: !!nextKeys.anthropic, mistral: !!nextKeys.mistral, openrouter: !!nextKeys.openrouter }));
      setModel(modelForProvider.id);
      localStorage.setItem("selected-model", modelForProvider.id);
      localStorage.setItem("correctify_onboarding_v1", "complete");
      setIsOnboardingOpen(false);
      return true;
    } catch { return false; }
  };

  return (
    <>
      <DraggableHeader
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onHelpClick={() => setIsHelpModalOpen(true)}
        onUsageClick={() => setIsUsageModalOpen(true)}
        onAboutClick={handleOpenAbout}
        onReloadClick={handleReload}
        onQuitClick={handleQuit}
        theme={theme}
        onThemeToggle={toggleTheme}
        shortcutLabel={`${shortcutModifier.replace("CmdOrCtrl", isMac ? "Cmd" : "Ctrl")}+${shortcutKey}`}
        copyOnly={!autoPasteEnabled}
      />

      <OnboardingModal isOpen={isOnboardingOpen} onComplete={handleOnboarding} />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveApiKey}
        currentApiKeys={apiKeys}
        currentAutostartEnabled={autostartEnabled}
        currentSoundEnabled={soundEnabled}
        currentShortcutKey={shortcutKey}
        currentShortcutModifier={shortcutModifier}
        currentAutoPasteEnabled={autoPasteEnabled}
        onTestApiKey={async (provider, key) => {
          const modelInfo = MODELS.find((item) => item.provider === provider);
          if (!modelInfo) return false;
          try { await new UnifiedCorrector(provider, key, modelInfo.id).correct({ text: "Validation test.", writingStyle: "grammar" }); return true; } catch { return false; }
        }}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        shortcutKey={shortcutKey}
        shortcutModifier={shortcutModifier}
      />

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

      {/* Update Modal - shows when update is available */}
      {updateInfo && (
        <UpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onInstall={async () => {
            if (updateInfo.update) {
              setUpdateProgress("downloading");
              try {
                await installUpdate(
                  updateInfo.update,
                  (state) => setUpdateProgress(state),
                  async () => {
                    // Return true to restart, false to skip
                    return window.confirm("Update installed! Restart now?");
                  },
                );
              } catch (error) {
                console.error("Update failed:", error);
                setUpdateProgress(null);
                alert(`Update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
              }
            }
          }}
          version={updateInfo.version}
          releaseNotes={updateInfo.body}
          isDownloading={updateProgress === "downloading"}
          isInstalling={updateProgress === "installing"}
        />
      )}

      <UsageModal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} />

      <main className="min-h-screen flex justify-center p-6 bg-transparent pt-24 transition-colors overflow-auto">
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="input" className="block text-sm font-medium text-foreground">
                  {messages.home.inputLabel}
                </label>
                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-2 lg:flex">
                    <label htmlFor="preset" className="text-xs font-medium text-foreground">Preset:</label>
                    <select id="preset" value={selectedPresetId} onChange={(event) => handlePresetChange(event.target.value)} className="rounded-lg border border-border bg-background/40 px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"><option value="">Custom</option>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select>
                    <button type="button" onClick={handleSavePreset} aria-label="Save current settings as preset" className="rounded-lg p-1.5 text-primary hover:bg-primary/10"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="correction-language" className="text-xs font-medium text-foreground">Language:</label>
                    <select id="correction-language" value={languagePreference} onChange={(event) => setLanguagePreference(event.target.value as LanguagePreference)} disabled={isLoading} className="rounded-lg border border-border bg-background/40 px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"><option value="auto">Auto ({detectedLanguage})</option><option value="en">English</option><option value="tr">Turkish</option><option value="de">German</option><option value="fr">French</option><option value="mixed">Mixed</option></select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{messages.home.styleLabel}</span>
                    <div className="relative" ref={styleDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-background/40 hover:bg-background/80 hover:text-foreground  rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-35"
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">
                          {styleOptions.find((option) => option.value === writingStyle)?.label}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform shrink-0 ${isStyleDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isStyleDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-card-bg border border-border rounded-lg shadow-lg z-10" style={{ backgroundColor: "var(--card-bg-solid)" }}>
                          {styleOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleStyleChange(option.value)}
                              className={`w-full text-left px-3 py-2.5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                writingStyle === option.value
                                  ? "bg-primary text-button-text"
                                  : "text-foreground hover:bg-foreground/5"
                              }`}
                            >
                              <div className="font-medium text-xs">{option.label}</div>
                              <div
                                className={`text-xs mt-0.5 ${
                                  writingStyle === option.value
                                    ? "text-button-text/80"
                                    : "text-foreground/60"
                                }`}
                              >
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="model" className="text-xs font-medium text-foreground">
                      {messages.home.modelLabel}
                    </label>
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-background/40 hover:bg-background/80 hover:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-40"
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">
                          {getModelById(model)?.name || messages.home.selectModel}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform shrink-0 ${isModelDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isModelDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-max min-w-37.5 max-w-75 bg-card-bg border border-border rounded-lg shadow-lg z-10 max-h-100 overflow-y-auto" style={{ backgroundColor: "var(--card-bg-solid)" }}>
                          {paidModels.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider border-b border-border">
                                {messages.home.paidModels}
                              </div>
                              {paidModels.map((modelInfo) => (
                                <button
                                  key={modelInfo.id}
                                  type="button"
                                  onClick={() => handleModelChange(modelInfo.id)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                                    model === modelInfo.id
                                      ? "bg-primary text-button-text"
                                      : "text-foreground hover:bg-foreground/5"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="flex-1 min-w-0">{modelInfo.name}</span>
                                    {modelInfo.badge && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">{modelInfo.badge}</span>}
                                    <span
                                      className={`text-[10px] uppercase shrink-0 ${
                                        model === modelInfo.id
                                          ? "text-button-text/60"
                                          : "text-foreground/40"
                                      }`}
                                    >
                                      {modelInfo.provider}
                                    </span>
                                  </div>
                                  {modelInfo.description && (
                                    <div
                                      className={`text-[10px] mt-0.5 ${
                                        model === modelInfo.id
                                          ? "text-button-text/70"
                                          : "text-foreground/50"
                                      }`}
                                    >
                                      {getModelDescription(modelInfo.id, modelInfo.description)}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                          {freeModels.length > 0 && (
                            <>
                              <div className="px-3 py-2 text-[10px] font-semibold text-foreground/40 uppercase tracking-wider border-t border-border">
                                {messages.home.freeModels}
                              </div>
                              {freeModels.map((modelInfo) => (
                                <button
                                  key={modelInfo.id}
                                  type="button"
                                  onClick={() => handleModelChange(modelInfo.id)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors last:rounded-b-lg ${
                                    model === modelInfo.id
                                      ? "bg-primary text-button-text"
                                      : "text-foreground hover:bg-foreground/5"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="flex-1 min-w-0">{modelInfo.name}</span>
                                    {modelInfo.badge && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">{modelInfo.badge}</span>}
                                    <span
                                      className={`text-[10px] uppercase shrink-0 ${
                                        model === modelInfo.id
                                          ? "text-button-text/60"
                                          : "text-foreground/40"
                                      }`}
                                    >
                                      {modelInfo.provider}
                                    </span>
                                  </div>
                                  {modelInfo.description && (
                                    <div
                                      className={`text-[10px] mt-0.5 ${
                                        model === modelInfo.id
                                          ? "text-button-text/70"
                                          : "text-foreground/50"
                                      }`}
                                    >
                                      {getModelDescription(modelInfo.id, modelInfo.description)}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </>
                          )}
                          {availableModels.length === 0 && (
                            <div className="px-3 py-4 text-xs text-foreground/50 text-center">
                              No models available. Please add an API key in Settings.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                id="input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={messages.home.inputPlaceholder}
                className={`w-full ${review ? "h-64" : "h-96"} px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground transition-colors placeholder:text-muted-foreground`}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="w-full px-6 py-3 bg-primary text-button-text font-medium rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? messages.home.correctingButton : messages.home.correctButton}
            </button>

            <div className="flex items-center justify-center gap-4 text-sm text-foreground/60">
              <div className="flex items-center gap-1.5">
                {isMac ? (
                  <>
                    <kbd className="px-2 py-1 bg-foreground/5 border border-foreground/10 rounded text-xs font-medium flex items-center gap-1">
                      <Command className="w-3 h-3" />
                      <CornerDownLeft className="w-3 h-3" />
                    </kbd>
                    <span className="text-xs">{messages.home.shortcutMac}</span>
                  </>
                ) : (
                  <>
                    <kbd className="px-2 py-1 bg-foreground/5 border border-foreground/10 rounded text-xs font-medium">
                      Ctrl+Enter
                    </kbd>
                    <span className="text-xs">{messages.home.shortcutWinLinux}</span>
                  </>
                )}
              </div>
            </div>
          </form>

          {availableModels.length === 0 && (
            <div className="mt-6 p-4 bg-error-bg border border-error-border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <svg
                    className="w-5 h-5 text-error-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    role="img"
                    aria-labelledby="errorIconTitle"
                  >
                    <title id="errorIconTitle">Error</title>
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-error-text mb-1">
                    {messages.home.noApiKeyTitle}
                  </h3>
                  <p className="text-sm text-error-text mb-2">
                    {messages.home.noApiKeyMessage}{" "}
                    <button
                      type="button"
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="font-semibold underline hover:no-underline"
                    >
                      {messages.home.noApiKeyClickHere}
                    </button>{" "}
                    {messages.home.noApiKeyOr}{" "}
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(true)}
                      className="font-semibold underline hover:no-underline"
                    >
                      {messages.home.noApiKeyHelpGuide}
                    </button>{" "}
                    {messages.home.noApiKeyForInstructions}
                  </p>
                  <p className="text-xs text-error-text/80 italic">
                    Tip: OpenRouter offers free models, but you still need to create a free
                    account and get an API key (no credit card required).
                  </p>
                </div>
              </div>
            </div>
          )}

          {showGlobalShortcutInfo && (
            <div
              className={`mt-6 p-4 bg-info-bg border border-info-border rounded-lg transition-opacity duration-500 ${
                isInfoFadingOut ? "opacity-0" : "opacity-100"
              }`}
            >
              <h3 className="text-sm font-semibold text-info-text flex items-center gap-2 mb-2">
                <Lightbulb />
                {messages.home.quickCorrectionTitle}
              </h3>

              {autoPasteEnabled ? (
                <>
                  <p className="text-sm text-info-text mb-2">
                    Auto copy/paste is <strong>enabled</strong>. Simply select text and press the
                    shortcut:
                  </p>
                  <ol className="text-sm text-info-text space-y-1 ml-4 list-decimal">
                    <li className="ml-3">Select text in any app (just highlight it)</li>
                    <li className="ml-3">
                      Press{" "}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">
                        {isMac ? `Cmd+Shift+${shortcutKey}` : `Ctrl+Shift+${shortcutKey}`}
                      </kbd>
                    </li>
                    <li className="ml-3">
                      Wait for the notification - corrected text pastes automatically!
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="text-sm text-info-text mb-2">
                    {messages.home.quickCorrectionDescription}
                  </p>
                  <ol className="text-sm text-info-text space-y-1 ml-4 list-decimal">
                    <li className="ml-3">
                      {messages.home.quickCorrectionStep1}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">
                        {isMac ? "Cmd+C" : "Ctrl+C"}
                      </kbd>
                      )
                    </li>
                    <li className="ml-3">
                      {messages.home.quickCorrectionStep2}{" "}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">
                        {isMac ? `Cmd+Shift+${shortcutKey}` : `Ctrl+Shift+${shortcutKey}`}
                      </kbd>
                    </li>
                    <li className="ml-3">{messages.home.quickCorrectionStep3}</li>
                    <li className="ml-3">
                      {messages.home.quickCorrectionStep4}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">
                        {isMac ? "Cmd+V" : "Ctrl+V"}
                      </kbd>
                      )
                    </li>
                  </ol>
                </>
              )}

              <p className="text-sm text-info-text mt-3 italic">
                {messages.home.quickCorrectionCustomize}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-error-bg border border-error-border rounded-lg">
              <p className="text-sm text-error-text">{error}</p>

              {showFallbackOption && fallbackModelId && (
                <div className="mt-3 pt-3 border-t border-error-border">
                  <p className="text-sm text-error-text mb-2">
                    Would you like to retry with{" "}
                    <strong>{getModelById(fallbackModelId)?.name}</strong> (free model)?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetryWithFallback}
                      className="px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      Retry with Free Model
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFallbackOption(false)}
                      className="px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {review && meta && <ReviewPanel review={review} model={meta.model || model} duration={meta.duration || 0} estimatedCost={(() => { const info = getModelById(model); return info?.costPer1MToken ? ((meta.usage?.inputTokens || 0) * info.costPer1MToken.input + (meta.usage?.outputTokens || 0) * info.costPer1MToken.output) / 1_000_000 : 0; })()} onChange={setReview} onCopy={handleCopyReview} onReplace={(text) => { setInputText(text); setReview(null); setOutputText(""); }} onRestore={() => { setInputText(review.original); setReview(null); setOutputText(""); }} />}

        </div>
      </main>
    </>
  );
}
