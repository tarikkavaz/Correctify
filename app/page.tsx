"use client";

import AboutModal from "@/components/AboutModal";
import DraggableHeader from "@/components/DraggableHeader";
import HelpModal from "@/components/HelpModal";
import SettingsModal from "@/components/SettingsModal";
import UpdateModal from "@/components/UpdateModal";
import UsageModal from "@/components/UsageModal";
import { UnifiedCorrector, getProviderForModel } from "@/lib/llm";
import { MODELS, type ModelInfo, getAvailableModels, getModelById } from "@/lib/models";
import { deleteKey, getKey, migrateFromLocalStorage, setKey } from "@/lib/secure-keys";
import type { CorrectionResponse, Provider, WritingStyle } from "@/lib/types";
import { checkForUpdates, installUpdate, type UpdateInfo } from "@/lib/updater";
import { estimateTokens, trackUsage } from "@/lib/usage-tracker";
import { useLocale } from "@/lib/useLocale";
import { useTheme } from "@/lib/useTheme";
import { isMacOS, isTauri } from "@/lib/utils";
import { Check, ChevronDown, Command, Copy, CornerDownLeft, Lightbulb } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [apiKey, setApiKey] = useState("");
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
  const [model, setModel] = useState<string>("gpt-4o-mini");
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

  useEffect(() => {
    // Detect OS only on client side to avoid hydration mismatch
    setIsMac(isMacOS());
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      // Migrate from localStorage to secure storage (one-time, Tauri only)
      if (isTauri()) {
        await migrateFromLocalStorage();
      }

      // Load all API keys from secure storage
      const loadedKeys: Record<Provider, string> = {
        openai: (await getKey("openai-api-key")) || "",
        anthropic: (await getKey("anthropic-api-key")) || "",
        mistral: (await getKey("mistral-api-key")) || "",
        openrouter: (await getKey("openrouter-api-key")) || "",
      };

      setApiKeys(loadedKeys);
      // Keep apiKey state for backward compatibility
      setApiKey(loadedKeys.openai);

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
      if (savedModel && available.some((m) => m.id === savedModel)) {
        setModel(savedModel);
      } else if (available.length > 0) {
        setModel(available[0].id);
      }

      const savedStyle = localStorage.getItem("writing-style") as WritingStyle | null;
      if (
        savedStyle &&
        ["grammar", "formal", "informal", "collaborative", "concise"].includes(savedStyle)
      ) {
        setWritingStyle(savedStyle);
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

      // Listen for global shortcut event from Rust backend
      if (isTauri()) {
        const { listen } = await import("@tauri-apps/api/event");
        const { invoke } = await import("@tauri-apps/api/core");
        const { isPermissionGranted, requestPermission } = await import(
          "@tauri-apps/plugin-notification"
        );

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

        // Check and request notification permissions
        let permissionGranted = await isPermissionGranted();
        console.log("Notification permission granted:", permissionGranted);

        if (!permissionGranted) {
          console.log("Requesting notification permission...");
          const permission = await requestPermission();
          permissionGranted = permission === "granted";
          console.log("Notification permission result:", permission);
        }

        // Send a test notification if permissions are granted
        if (permissionGranted) {
          const { sendNotification } = await import("@tauri-apps/plugin-notification");
          const { platform } = await import("@tauri-apps/plugin-os");

          try {
            const platformName = await platform();
            const shortcutKey = platformName === "macos" ? "Cmd" : "Ctrl";

            await sendNotification({
              title: "🚀 Correctify Ready",
              body: `Global shortcut ${shortcutKey}+Shift+] is active!`,
            });
            console.log("✅ Test notification sent successfully");
          } catch (err) {
            console.error("❌ Failed to send test notification:", err);
          }
        } else {
          console.warn("⚠️ Notification permission not granted. Notifications will not work.");
          console.warn(
            "Please enable notifications in System Settings > Notifications > Correctify",
          );
        }

        const unlisten = await listen(
          "correct-clipboard-text",
          async (event: { payload: string }) => {
            const textToCorrect = event.payload;
            console.log("=== Received text to correct from global shortcut ===");
            console.log("Text length:", textToCorrect.length);
            console.log("Text preview:", textToCorrect.substring(0, 100));

            // Check if API key is available
            // Get current model and its provider
            const currentModel = localStorage.getItem("selected-model") || "gpt-4o-mini";
            const provider = getProviderForModel(currentModel);

            // Check if API key for this provider is configured
            const currentApiKey = await getKey(`${provider}-api-key`);
            if (!currentApiKey) {
              console.error("❌ No API key available - please configure in settings");
              // Send error notification
              try {
                const { sendNotification } = await import("@tauri-apps/plugin-notification");
                const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
                await sendNotification({
                  title: "❌ Correctify Error",
                  body: `Please configure your ${providerName} API key in settings first!`,
                });
                console.log("✅ Error notification sent for missing API key");
              } catch (err) {
                console.error("❌ Failed to send error notification:", err);
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
              console.error("❌ Failed to correct text:", err);
              // Send error notification
              try {
                const { sendNotification } = await import("@tauri-apps/plugin-notification");
                await sendNotification({
                  title: "❌ Correctify Error",
                  body: `Failed to correct text: ${err instanceof Error ? err.message : "Unknown error"}`,
                });
                console.log("✅ Error notification sent for correction failure");
              } catch (notifErr) {
                console.error("❌ Failed to send error notification:", notifErr);
              }
            }
          },
        );

        return unlisten;
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

  const handleModelChange = (newModelId: string) => {
    setModel(newModelId);
    localStorage.setItem("selected-model", newModelId);
    setIsModelDropdownOpen(false);
  };

  const handleStyleChange = (newStyle: WritingStyle) => {
    setWritingStyle(newStyle);
    localStorage.setItem("writing-style", newStyle);
    setIsStyleDropdownOpen(false);
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
    setApiKey(newApiKeys.openai); // For backward compatibility
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
        setModel(available[0].id);
        localStorage.setItem("selected-model", available[0].id);
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
    setMeta(null);

    const startTime = Date.now();

    try {
      // Check if we're in production build or dev mode
      const isProduction = process.env.NODE_ENV === "production";

      // In Tauri production, call LLM directly since static export doesn't support API routes
      // In dev mode, always use API route to avoid CORS issues
      if (isTauri() && isProduction) {
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
        });

        const duration = Date.now() - startTime;

        setOutputText(result.result);
        setMeta({
          duration,
          model: model,
          provider: provider,
        });

        // Track usage
        trackUsage({
          timestamp: Date.now(),
          provider,
          model,
          tokens: estimateTokens(inputText) + estimateTokens(result.result),
          duration,
          success: true,
        });

        // Play completed sound
        try {
          await invoke("play_sound_in_app", { soundType: "completed" });
        } catch (err) {
          console.error("Failed to play completed sound:", err);
        }
      } else {
        // In browser, use API route to keep API key more secure
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          [`x-${provider}-key`]: modelApiKey,
        };

        const customRules = localStorage.getItem("custom-rules") || "";
        const response = await fetch("/api/correct", {
          method: "POST",
          headers,
          body: JSON.stringify({
            text: inputText,
            provider: provider,
            model: model,
            writingStyle: writingStyle,
            customRules: customRules.trim() || undefined,
          }),
        });

        const data: CorrectionResponse = await response.json();

        if (!data.ok) {
          setError(data.error || "An error occurred");

          // Track failed usage
          trackUsage({
            timestamp: Date.now(),
            provider,
            model,
            tokens: estimateTokens(inputText),
            duration: Date.now() - startTime,
            success: false,
            error: data.error || "An error occurred",
          });
        } else {
          setOutputText(data.result || "");
          setMeta(data.meta || null);

          // Track successful usage
          trackUsage({
            timestamp: Date.now(),
            provider,
            model,
            tokens: estimateTokens(inputText) + estimateTokens(data.result || ""),
            duration: data.meta?.duration || Date.now() - startTime,
            success: true,
          });
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
        tokens: estimateTokens(inputText),
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg,
      });

      // Check if a free fallback model is available
      const freeModels = availableModels.filter((m) => m.category === "free");
      if (freeModels.length > 0 && model !== freeModels[0].id) {
        setFallbackModelId(freeModels[0].id);
        setShowFallbackOption(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryWithFallback = () => {
    if (fallbackModelId) {
      setModel(fallbackModelId);
      localStorage.setItem("selected-model", fallbackModelId);
      setShowFallbackOption(false);
      setFallbackModelId(null);
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
      />

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

      <main className="h-screen flex justify-center p-6 bg-transparent pt-24 transition-colors overflow-auto">
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="input" className="block text-sm font-medium text-foreground">
                  {messages.home.inputLabel}
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground/60">{messages.home.styleLabel}</span>
                    <div className="relative" ref={styleDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 hover:text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px]"
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">
                          {styleOptions.find((option) => option.value === writingStyle)?.label}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform flex-shrink-0 ${isStyleDropdownOpen ? "rotate-180" : ""}`}
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
                    <label htmlFor="model" className="text-xs font-medium text-foreground/60">
                      {messages.home.modelLabel}
                    </label>
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-foreground/10 hover:bg-foreground/15 hover:text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[160px]"
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">
                          {getModelById(model)?.name || messages.home.selectModel}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform flex-shrink-0 ${isModelDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isModelDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-max min-w-[150px] max-w-[300px] bg-card-bg border border-border rounded-lg shadow-lg z-10 max-h-[400px] overflow-y-auto" style={{ backgroundColor: "var(--card-bg-solid)" }}>
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
                                    <span
                                      className={`text-[10px] uppercase flex-shrink-0 ${
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
                                    <span
                                      className={`text-[10px] uppercase flex-shrink-0 ${
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
                className="w-full h-96 px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground transition-colors placeholder:text-muted-foreground"
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
                <div className="flex-shrink-0">
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
                    💡 Tip: OpenRouter offers free models, but you still need to create a free
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

          {outputText && (
            <div className="mt-6 space-y-4 pb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium text-foreground">
                    {messages.home.outputLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors"
                    aria-label="Copy to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{messages.home.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{messages.home.copy}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 pb-8 bg-card border border-border rounded-lg min-h-[12rem] transition-colors">
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{outputText}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {meta && (
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>
                    {messages.home.metaModel} {meta.model}
                  </span>
                  {meta.duration && (
                    <span>
                      {messages.home.metaDuration} {(meta.duration / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
