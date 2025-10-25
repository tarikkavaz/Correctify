'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { Command, CornerDownLeft, Copy, Check, ChevronDown, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CorrectionResponse, WritingStyle } from '@/lib/types';
import SettingsModal from '@/components/SettingsModal';
import HelpModal from '@/components/HelpModal';
import DraggableHeader from '@/components/DraggableHeader';
import { OpenAICorrector } from '@/lib/openai';
import { isTauri } from '@/lib/utils';
import { useTheme } from '@/lib/useTheme';
import { useLocale } from '@/lib/useLocale';

export default function HomePage() {
  const { messages } = useLocale();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true); // Default: enabled
  const [shortcutKey, setShortcutKey] = useState('.'); // Default: period
  const [autoPasteEnabled, setAutoPasteEnabled] = useState(false); // Default: disabled
  const [model, setModel] = useState<'gpt-5' | 'gpt-5-mini' | 'gpt-4o-mini'>('gpt-4o-mini');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('grammar');
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<CorrectionResponse['meta'] | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showGlobalShortcutInfo, setShowGlobalShortcutInfo] = useState(false);
  const [isInfoFadingOut, setIsInfoFadingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    const savedModel = localStorage.getItem('openai-model') as 'gpt-5' | 'gpt-5-mini' | 'gpt-4o-mini' | null;
    if (savedModel && (savedModel === 'gpt-5' || savedModel === 'gpt-5-mini' || savedModel === 'gpt-4o-mini')) {
      setModel(savedModel);
    }

    const savedStyle = localStorage.getItem('writing-style') as WritingStyle | null;
    if (savedStyle && ['grammar', 'formal', 'informal', 'collaborative', 'concise'].includes(savedStyle)) {
      setWritingStyle(savedStyle);
    }

    const savedAutostart = localStorage.getItem('autostart-enabled');
    if (savedAutostart === 'true') {
      setAutostartEnabled(true);
    }

    const savedSoundEnabled = localStorage.getItem('sound-enabled');
    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true');
    }

    const savedShortcutKey = localStorage.getItem('shortcut-key');
    if (savedShortcutKey) {
      setShortcutKey(savedShortcutKey);
    }

    const savedAutoPasteEnabled = localStorage.getItem('auto-paste-enabled');
    if (savedAutoPasteEnabled !== null) {
      setAutoPasteEnabled(savedAutoPasteEnabled === 'true');
    }

    // Check if running in Tauri (client-side only)
    setShowGlobalShortcutInfo(isTauri());

    // Listen for global shortcut event from Rust backend
    if (isTauri()) {
      const setupListener = async () => {
        const { listen } = await import('@tauri-apps/api/event');
        const { invoke } = await import('@tauri-apps/api/core');
        const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');

        console.log('Setting up global shortcut event listener...');

        // Initialize Rust settings from localStorage
        const currentSoundEnabled = localStorage.getItem('sound-enabled') !== 'false'; // Default: true
        const currentShortcutKey = localStorage.getItem('shortcut-key') || '.';
        const currentAutoPasteEnabled = localStorage.getItem('auto-paste-enabled') === 'true'; // Default: false
        
        try {
          await invoke('set_sound_enabled', { enabled: currentSoundEnabled });
          console.log('Sound enabled set to:', currentSoundEnabled);
          
          await invoke('set_auto_paste_enabled', { enabled: currentAutoPasteEnabled });
          console.log('Auto-paste enabled set to:', currentAutoPasteEnabled);
          
          if (currentShortcutKey !== '.') {
            await invoke('update_shortcut', { newKey: currentShortcutKey });
            console.log('Shortcut key set to:', currentShortcutKey);
          }
        } catch (err) {
          console.error('Failed to initialize settings:', err);
        }

        // Check and request notification permissions
        let permissionGranted = await isPermissionGranted();
        console.log('Notification permission granted:', permissionGranted);
        
        if (!permissionGranted) {
          console.log('Requesting notification permission...');
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
          console.log('Notification permission result:', permission);
        }

        // Send a test notification if permissions are granted
        if (permissionGranted) {
          const { sendNotification } = await import('@tauri-apps/plugin-notification');
          const { platform } = await import('@tauri-apps/plugin-os');
          
          try {
            const platformName = await platform();
            const shortcutKey = platformName === 'macos' ? 'Cmd' : 'Ctrl';
            
            await sendNotification({
              title: '🚀 Correctify Ready',
              body: `Global shortcut ${shortcutKey}+Shift+] is active!`
            });
            console.log('✅ Test notification sent successfully');
          } catch (err) {
            console.error('❌ Failed to send test notification:', err);
          }
        } else {
          console.warn('⚠️ Notification permission not granted. Notifications will not work.');
          console.warn('Please enable notifications in System Settings > Notifications > Correctify');
        }

        const unlisten = await listen('correct-clipboard-text', async (event: any) => {
          const textToCorrect = event.payload;
          console.log('=== Received text to correct from global shortcut ===');
          console.log('Text length:', textToCorrect.length);
          console.log('Text preview:', textToCorrect.substring(0, 100));

          // Check if API key is available
          const currentApiKey = localStorage.getItem('openai-api-key');
          if (!currentApiKey) {
            console.error('❌ No API key available - please configure in settings');
            // Send error notification
            try {
              const { sendNotification } = await import('@tauri-apps/plugin-notification');
              await sendNotification({
                title: '❌ Correctify Error',
                body: 'Please configure your OpenAI API key in settings first!'
              });
              console.log('✅ Error notification sent for missing API key');
            } catch (err) {
              console.error('❌ Failed to send error notification:', err);
            }
            return;
          }

          try {
            console.log('Starting correction...');
            const correctionStartTime = Date.now();
            
            // Perform correction
            const currentModel = localStorage.getItem('openai-model') as 'gpt-5' | 'gpt-5-mini' | 'gpt-4o-mini' || 'gpt-4o-mini';
            const currentStyle = localStorage.getItem('writing-style') as WritingStyle || 'grammar';
            const corrector = new OpenAICorrector(currentApiKey, currentModel);
            const result = await corrector.correct({ text: textToCorrect, writingStyle: currentStyle });

            const correctionDuration = Date.now() - correctionStartTime;
            console.log('Correction result:', result.result.substring(0, 100));
            console.log('Correction duration:', correctionDuration, 'ms');
            
            // Get auto-paste setting
            const autoPasteEnabled = localStorage.getItem('auto-paste-enabled') === 'true';
            
            // Send corrected text back to Rust with model, duration, and auto-paste flag
            await invoke('handle_corrected_text', { 
              text: result.result,
              model: currentModel,
              duration: correctionDuration,
              autoPaste: autoPasteEnabled
            });
            console.log('=== Correction completed successfully ===');
          } catch (err) {
            console.error('❌ Failed to correct text:', err);
            // Send error notification
            try {
              const { sendNotification } = await import('@tauri-apps/plugin-notification');
              await sendNotification({
                title: '❌ Correctify Error',
                body: 'Failed to correct text: ' + (err instanceof Error ? err.message : 'Unknown error')
              });
              console.log('✅ Error notification sent for correction failure');
            } catch (notifErr) {
              console.error('❌ Failed to send error notification:', notifErr);
            }
          }
        });

        return unlisten;
      };

      setupListener().catch(err => {
        console.error('Failed to setup event listener:', err);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleModelChange = (newModel: 'gpt-5' | 'gpt-5-mini' | 'gpt-4o-mini') => {
    setModel(newModel);
    localStorage.setItem('openai-model', newModel);
    setIsModelDropdownOpen(false);
  };

  const handleStyleChange = (newStyle: WritingStyle) => {
    setWritingStyle(newStyle);
    localStorage.setItem('writing-style', newStyle);
    setIsStyleDropdownOpen(false);
  };

  const modelOptions = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5', label: 'GPT-5' },
  ] as const;

  const styleOptions = [
    { value: 'grammar', label: 'Grammar Only', description: 'Fixes grammar and typos only' },
    { value: 'formal', label: 'Formal', description: 'Polished and professional tone' },
    { value: 'informal', label: 'Informal', description: 'Natural and conversational tone' },
    { value: 'collaborative', label: 'Collaborative', description: 'Friendly, inclusive team tone' },
    { value: 'concise', label: 'Concise', description: 'Clear and to the point' },
  ] as const;

  const handleOpenAbout = async () => {
    if (isTauri()) {
      try {
        const { WebviewWindow, getAllWebviewWindows } = await import('@tauri-apps/api/webviewWindow');
        
        // Check if about window already exists
        const windows = await getAllWebviewWindows();
        const aboutWindow = windows.find(w => w.label === 'about');
        
        if (aboutWindow) {
          await aboutWindow.show();
          await aboutWindow.setFocus();
        } else {
          // Create new about window
          new WebviewWindow('about', {
            url: '/about',
            title: 'About Correctify',
            width: 400,
            height: 550,
            resizable: false,
            center: true,
          });
        }
      } catch (err) {
        console.error('Failed to open about window:', err);
      }
    }
  };

  const handleReload = () => {
    if (isTauri()) {
      try {
        window.location.reload();
      } catch (err) {
        console.error('Failed to reload window:', err);
      }
    }
  };

  const handleSaveApiKey = async (newApiKey: string, newAutostartEnabled: boolean, newSoundEnabled: boolean, newShortcutKey: string, newAutoPasteEnabled: boolean) => {
    setApiKey(newApiKey);
    setAutostartEnabled(newAutostartEnabled);
    setSoundEnabled(newSoundEnabled);
    setShortcutKey(newShortcutKey);
    setAutoPasteEnabled(newAutoPasteEnabled);
    
    if (newApiKey) {
      localStorage.setItem('openai-api-key', newApiKey);
    } else {
      localStorage.removeItem('openai-api-key');
    }

    localStorage.setItem('autostart-enabled', newAutostartEnabled.toString());
    localStorage.setItem('sound-enabled', newSoundEnabled.toString());
    localStorage.setItem('shortcut-key', newShortcutKey);
    localStorage.setItem('auto-paste-enabled', newAutoPasteEnabled.toString());

    // Handle settings via Tauri
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Update sound setting in Rust
        await invoke('set_sound_enabled', { enabled: newSoundEnabled });
        console.log('Sound enabled updated to:', newSoundEnabled);
        
        // Update auto-paste setting in Rust
        await invoke('set_auto_paste_enabled', { enabled: newAutoPasteEnabled });
        console.log('Auto-paste enabled updated to:', newAutoPasteEnabled);
        
        // Update shortcut if changed
        if (newShortcutKey !== shortcutKey) {
          await invoke('update_shortcut', { newKey: newShortcutKey });
          console.log('Shortcut updated to: Cmd+Shift+' + newShortcutKey);
        }
        
        // Handle autostart
        const { enable, disable, isEnabled } = await import('@tauri-apps/plugin-autostart');
        const currentlyEnabled = await isEnabled();
        
        if (newAutostartEnabled && !currentlyEnabled) {
          await enable();
          console.log('Autostart enabled');
        } else if (!newAutostartEnabled && currentlyEnabled) {
          await disable();
          console.log('Autostart disabled');
        }
      } catch (err) {
        console.error('Failed to update settings:', err);
      }
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!inputText.trim()) {
      setError('Please enter some text to correct');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please add your OpenAI API key');
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
    setError('');
    setOutputText('');
    setMeta(null);

    const startTime = Date.now();

    try {
      // In Tauri, call OpenAI directly since static export doesn't support API routes
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Play processing sound
        try {
          await invoke('play_sound_in_app', { soundType: 'processing' });
        } catch (err) {
          console.error('Failed to play processing sound:', err);
        }
        
        const corrector = new OpenAICorrector(apiKey, model);
        const result = await corrector.correct({
          text: inputText,
          writingStyle: writingStyle,
        });

        const duration = Date.now() - startTime;

        setOutputText(result.result);
        setMeta({
          duration,
          model: model,
          provider: 'openai',
        });
        
        // Play completed sound
        try {
          await invoke('play_sound_in_app', { soundType: 'completed' });
        } catch (err) {
          console.error('Failed to play completed sound:', err);
        }
      } else {
        // In browser, use API route to keep API key more secure
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-OPENAI-KEY': apiKey,
        };

        const response = await fetch('/api/correct', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text: inputText,
            provider: 'openai',
            model: model,
            writingStyle: writingStyle,
          }),
        });

        const data: CorrectionResponse = await response.json();

        if (!data.ok) {
          setError(data.error || 'An error occurred');
        } else {
          setOutputText(data.result || '');
          setMeta(data.meta || null);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to the server';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <DraggableHeader
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onHelpClick={() => setIsHelpModalOpen(true)}
        onAboutClick={handleOpenAbout}
        onReloadClick={handleReload}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveApiKey}
        currentApiKey={apiKey}
        currentAutostartEnabled={autostartEnabled}
        currentSoundEnabled={soundEnabled}
        currentShortcutKey={shortcutKey}
        currentAutoPasteEnabled={autoPasteEnabled}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        shortcutKey={shortcutKey}
      />

      <main className="h-screen flex justify-center p-6 bg-background pt-24 transition-colors overflow-auto">
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="input" className="block text-sm font-medium text-foreground">
                  {messages.home.inputLabel}
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-foreground/60">
                      Style
                    </label>
                    <div className="relative" ref={styleDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground/70 bg-foreground/5 hover:bg-foreground/10 hover:text-foreground border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px]"
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">{styleOptions.find(option => option.value === writingStyle)?.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isStyleDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-stone-800 border border-border rounded-lg shadow-lg z-10">
                          {styleOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleStyleChange(option.value)}
                              className={`w-full text-left px-3 py-2.5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                writingStyle === option.value
                                  ? 'bg-primary text-button-text'
                                  : 'text-foreground hover:bg-foreground/5'
                              }`}
                            >
                              <div className="font-medium text-xs">{option.label}</div>
                              <div className={`text-xs mt-0.5 ${
                                writingStyle === option.value
                                  ? 'text-button-text/80'
                                  : 'text-foreground/60'
                              }`}>
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
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground/70 bg-foreground/5 hover:bg-foreground/10 hover:text-foreground border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                        disabled={isLoading}
                      >
                        <span className="flex-1 text-left">{modelOptions.find(option => option.value === model)?.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isModelDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-white dark:bg-stone-800 border border-border rounded-lg shadow-lg z-10">
                          {modelOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleModelChange(option.value)}
                              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                model === option.value
                                  ? 'bg-primary text-button-text'
                                  : 'text-foreground hover:bg-foreground/5'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
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
                className="w-full h-96 px-4 py-3 bg-white dark:bg-stone-900 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground transition-colors"
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
                <kbd className="px-2 py-1 bg-foreground/5 border border-foreground/10 rounded text-xs font-medium flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <CornerDownLeft className="w-3 h-3" />
                </kbd>
                <span className="text-xs">{messages.home.shortcutMac}</span>
              </div>
              <span className="text-foreground/30">{messages.home.shortcutOr}</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-foreground/5 border border-foreground/10 rounded text-xs font-medium">
                  Ctrl+Enter
                </kbd>
                <span className="text-xs">{messages.home.shortcutWinLinux}</span>
              </div>
            </div>
          </form>

          {!apiKey && (
            <div className="mt-6 p-4 bg-error-bg border border-error-border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-error-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-error-text mb-1">
                    {messages.home.noApiKeyTitle}
                  </h3>
                  <p className="text-sm text-error-text">
                    {messages.home.noApiKeyMessage}{' '}
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="font-semibold underline hover:no-underline"
                    >
                      {messages.home.noApiKeyClickHere}
                    </button>
                    {' '}{messages.home.noApiKeyOr}{' '}
                    <button
                      onClick={() => setIsHelpModalOpen(true)}
                      className="font-semibold underline hover:no-underline"
                    >
                      {messages.home.noApiKeyHelpGuide}
                    </button>
                    {' '}{messages.home.noApiKeyForInstructions}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showGlobalShortcutInfo && (
            <div 
              className={`mt-6 p-4 bg-info-bg border border-info-border rounded-lg transition-opacity duration-500 ${
                isInfoFadingOut ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <h3 className="text-sm font-semibold text-info-text flex items-center gap-2 mb-2">
                <Lightbulb />
                {messages.home.quickCorrectionTitle}
              </h3>
              
              {autoPasteEnabled ? (
                <>
                  <p className="text-sm text-info-text mb-2">
                    Auto copy/paste is <strong>enabled</strong>. Simply select text and press the shortcut:
                  </p>
                  <ol className="text-sm text-info-text space-y-1 ml-4 list-decimal">
                    <li className="ml-3">
                      Select text in any app (just highlight it)
                    </li>
                    <li className="ml-3">
                      Press{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+Shift+{shortcutKey}</kbd>
                      {' '}{messages.home.shortcutOr}{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+Shift+{shortcutKey}</kbd>
                    </li>
                    <li className="ml-3">Wait for the notification - corrected text pastes automatically!</li>
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
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+C</kbd>
                      {' '}{messages.home.shortcutOr}{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+C</kbd>)
                    </li>
                    <li className="ml-3">
                      {messages.home.quickCorrectionStep2}{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+Shift+{shortcutKey}</kbd>
                      {' '}{messages.home.shortcutOr}{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+Shift+{shortcutKey}</kbd>
                    </li>
                    <li className="ml-3">{messages.home.quickCorrectionStep3}</li>
                    <li className="ml-3">
                      {messages.home.quickCorrectionStep4}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+V</kbd>
                      {' '}{messages.home.shortcutOr}{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+V</kbd>)
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
            </div>
          )}

          {outputText && (
            <div className="mt-6 space-y-4 pb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    {messages.home.outputLabel}
                  </label>
                  <button
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
                <div className="p-4 pb-8 bg-white dark:bg-stone-900 border border-border rounded-lg min-h-[12rem] transition-colors">
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {outputText}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {meta && (
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>
                    {messages.home.metaModel} {meta.model}
                  </span>
                  {meta.duration && (
                    <span>{messages.home.metaDuration} {(meta.duration / 1000).toFixed(2)}s</span>
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
