'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Settings } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useLocale } from '@/lib/useLocale';
import { isTauri } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, autostartEnabled: boolean, soundEnabled: boolean, shortcutKey: string, autoUpdateEnabled: boolean) => void;
  currentApiKey: string;
  currentAutostartEnabled: boolean;
  currentSoundEnabled: boolean;
  currentShortcutKey: string;
  currentAutoUpdateEnabled: boolean;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
  currentAutostartEnabled,
  currentSoundEnabled,
  currentShortcutKey,
  currentAutoUpdateEnabled,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [autostartEnabled, setAutostartEnabled] = useState(currentAutostartEnabled);
  const [soundEnabled, setSoundEnabled] = useState(currentSoundEnabled);
  const [shortcutKey, setShortcutKey] = useState(currentShortcutKey);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(currentAutoUpdateEnabled);
  const [isTauriApp, setIsTauriApp] = useState(false);
  const { messages } = useLocale();

  useEffect(() => {
    setIsTauriApp(isTauri());
  }, []);

  useEffect(() => {
    setApiKey(currentApiKey);
    setAutostartEnabled(currentAutostartEnabled);
    setSoundEnabled(currentSoundEnabled);
    setShortcutKey(currentShortcutKey);
    setAutoUpdateEnabled(currentAutoUpdateEnabled);
  }, [currentApiKey, currentAutostartEnabled, currentSoundEnabled, currentShortcutKey, currentAutoUpdateEnabled, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(apiKey, autostartEnabled, soundEnabled, shortcutKey, autoUpdateEnabled);
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
  };

  const handleOpenAPIKey = async () => {
    try {
      await open('https://platform.openai.com/api-keys');
    } catch (error) {
      console.error('Failed to open API key URL:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{backgroundColor: 'var(--color-modal-backdrop)'}}>
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
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label="Close API settings"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="apiKey" className="block text-sm font-medium text-foreground">
                {messages.apiModal.apiKeyLabel}
              </label>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm font-medium text-text-muted hover:text-foreground transition-colors"
                >
                  {messages.apiModal.clear}
                </button>
              )}
            </div>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={messages.apiModal.apiKeyPlaceholder}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors"
              autoFocus
            />
            <div className="flex items-start gap-2 text-xs text-foreground/60">
              <p className="flex-1">
                {messages.apiModal.securityNote}
              </p>
            </div>
            <button
              onClick={handleOpenAPIKey}
              className="inline-flex items-center text-xs text-primary hover:underline cursor-pointer"
            >
              {messages.apiModal.getKeyInstructions} {messages.apiModal.openAiPlatform} →
            </button>
          </div>

          {/* Autostart Option (Desktop Only) */}
          {isTauriApp && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-start gap-3">
                <input
                  id="autostart"
                  type="checkbox"
                  checked={autostartEnabled}
                  onChange={(e) => setAutostartEnabled(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1">
                  <label htmlFor="autostart" className="block text-sm font-medium text-foreground cursor-pointer">
                    {messages.apiModal.autostartLabel}
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    {messages.apiModal.autostartDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sound Notifications (Desktop Only) */}
          {isTauriApp && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-start gap-3">
                <input
                  id="soundEnabled"
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1">
                  <label htmlFor="soundEnabled" className="block text-sm font-medium text-foreground cursor-pointer">
                    {messages.apiModal.soundLabel}
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    {messages.apiModal.soundDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Global Shortcut Customization (Desktop Only) */}
          {isTauriApp && (
            <div className="space-y-2 pt-2 border-t border-border">
              <label htmlFor="shortcutKey" className="block text-sm font-medium dark:text-gray-200">
                {messages.apiModal.globalShortcutLabel}
              </label>
              <div className="flex items-center gap-2">
                <div className="text-sm text-foreground/60 dark:text-gray-400">
                  Cmd+Shift+
                </div>
                <input
                  id="shortcutKey"
                  type="text"
                  value={shortcutKey}
                  onChange={(e) => setShortcutKey(e.target.value.slice(-1).toUpperCase())}
                  maxLength={1}
                  placeholder="."
                  className="w-16 text-center px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors uppercase"
                />
              </div>
              <p className="text-xs text-foreground/60">
                {messages.apiModal.shortcutDescription}
              </p>
            </div>
          )}

          {/* Auto-Update Settings (Desktop Only) */}
          {isTauriApp && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-start gap-3">
                <input
                  id="autoUpdateEnabled"
                  type="checkbox"
                  checked={autoUpdateEnabled}
                  onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1">
                  <label htmlFor="autoUpdateEnabled" className="block text-sm font-medium text-foreground cursor-pointer">
                    {messages.apiModal.autoUpdateLabel}
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    {messages.apiModal.autoUpdateDescription}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { invoke } = await import('@tauri-apps/api/core');
                    const updateAvailable = await invoke('check_for_updates');
                    if (updateAvailable) {
                      const shouldInstall = confirm(messages.apiModal.updateAvailableMessage);
                      if (shouldInstall) {
                        await invoke('install_update');
                      }
                    } else {
                      alert(messages.apiModal.noUpdatesMessage);
                    }
                  } catch (error) {
                    console.error('Update check failed:', error);
                    alert(messages.apiModal.updateErrorMessage);
                  }
                }}
                className="w-full px-3 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
              >
                {messages.apiModal.checkUpdatesButton}
              </button>
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
