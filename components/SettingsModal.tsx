'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Settings } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useLocale } from '@/lib/useLocale';
import { isTauri } from '@/lib/utils';
import { deleteKey } from '@/lib/secure-keys';
import { Provider } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKeys: Record<Provider, string>, autostartEnabled: boolean, soundEnabled: boolean, shortcutKey: string, autoPasteEnabled: boolean) => void;
  currentApiKeys: Record<Provider, string>;
  currentAutostartEnabled: boolean;
  currentSoundEnabled: boolean;
  currentShortcutKey: string;
  currentAutoPasteEnabled: boolean;
}

const API_KEY_CONFIG: Array<{
  provider: Provider;
  label: string;
  url: string;
  description: string;
}> = [
  {
    provider: 'openai',
    label: 'OpenAI API Key',
    url: 'https://platform.openai.com/api-keys',
    description: 'Get your API key from OpenAI Platform',
  },
  {
    provider: 'anthropic',
    label: 'Anthropic API Key',
    url: 'https://console.anthropic.com/settings/keys',
    description: 'Get your API key from Anthropic Console',
  },
  {
    provider: 'mistral',
    label: 'Mistral API Key',
    url: 'https://console.mistral.ai/api-keys/',
    description: 'Get your API key from Mistral Console',
  },
  {
    provider: 'openrouter',
    label: 'OpenRouter API Key',
    url: 'https://openrouter.ai/keys',
    description: 'Free account + API key unlock free models (no credit card)',
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
  currentAutoPasteEnabled,
}: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(currentApiKeys);
  const [autostartEnabled, setAutostartEnabled] = useState(currentAutostartEnabled);
  const [soundEnabled, setSoundEnabled] = useState(currentSoundEnabled);
  const [shortcutKey, setShortcutKey] = useState(currentShortcutKey);
  const [autoPasteEnabled, setAutoPasteEnabled] = useState(currentAutoPasteEnabled);
  const [isTauriApp, setIsTauriApp] = useState(false);
  const [activeTab, setActiveTab] = useState<'api-keys' | 'app-settings'>('api-keys');
  const { messages } = useLocale();

  useEffect(() => {
    setIsTauriApp(isTauri());
  }, []);

  useEffect(() => {
    setApiKeys(currentApiKeys);
    setAutostartEnabled(currentAutostartEnabled);
    setSoundEnabled(currentSoundEnabled);
    setShortcutKey(currentShortcutKey);
    setAutoPasteEnabled(currentAutoPasteEnabled);
  }, [currentApiKeys, currentAutostartEnabled, currentSoundEnabled, currentShortcutKey, currentAutoPasteEnabled, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(apiKeys, autostartEnabled, soundEnabled, shortcutKey, autoPasteEnabled);
    onClose();
  };

  const handleApiKeyChange = (provider: Provider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleClearApiKey = (provider: Provider) => {
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
  };

  const handleRemoveStoredKey = async (provider: Provider) => {
    if (!isTauri()) return;
    
    if (confirm(`Are you sure you want to remove the stored ${provider} API key? You will need to re-enter it.`)) {
      try {
        await deleteKey(`${provider}-api-key`);
        setApiKeys(prev => ({ ...prev, [provider]: '' }));
        alert('API key removed successfully from secure storage.');
      } catch (error) {
        console.error('Failed to remove API key:', error);
        alert('Failed to remove API key. Please try again.');
      }
    }
  };

  const handleOpenAPIKey = async (url: string) => {
    try {
      await open(url);
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

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('api-keys')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'api-keys'
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            API Keys
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('app-settings')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'app-settings'
                ? 'text-primary border-b-2 border-primary'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            App Settings
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="space-y-4">
            {API_KEY_CONFIG.map((config) => (
              <div key={config.provider} className="space-y-2 pb-4 border-b border-border last:border-0">
                <div className="flex items-center justify-between">
                  <label htmlFor={`apiKey-${config.provider}`} className="block text-sm font-medium text-foreground">
                    {config.label}
                    {config.provider === 'openrouter' && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
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
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors text-sm"
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
                      className="inline-flex items-center text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline cursor-pointer"
                    >
                      Remove from storage
                    </button>
                  )}
                </div>
              </div>
            ))}
              <div className="flex items-start gap-2 text-xs text-foreground/60 pt-2">
                <p className="flex-1">
                  {messages.apiModal.securityNote}
                </p>
              </div>
            </div>
          )}

          {/* App Settings Tab */}
          {activeTab === 'app-settings' && (
            <div className="space-y-6">
              {/* Autostart Option (Desktop Only) */}
              {isTauriApp && (
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <label htmlFor="shortcutKey" className="block text-sm font-medium text-foreground">
                    {messages.apiModal.globalShortcutLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-foreground/60">
                      Cmd+Shift+
                    </div>
                    <input
                      id="shortcutKey"
                      type="text"
                      value={shortcutKey}
                      onChange={(e) => setShortcutKey(e.target.value.slice(-1).toUpperCase())}
                      maxLength={1}
                      placeholder="]"
                      className="w-16 text-center px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-colors uppercase"
                    />
                  </div>
                  <p className="text-xs text-foreground/60">
                    {messages.apiModal.shortcutDescription}
                  </p>
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
                      className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex-1">
                      <label htmlFor="autoPaste" className="block text-sm font-medium text-foreground cursor-pointer">
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
