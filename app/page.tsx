'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { Command, CornerDownLeft, Copy, Check, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CorrectionResponse } from '@/lib/types';
import APIModal from '@/components/APIModal';
import DraggableHeader from '@/components/DraggableHeader';
import { OpenAICorrector } from '@/lib/openai';
import { isTauri } from '@/lib/utils';
import { useTheme } from '@/lib/useTheme';

export default function HomePage() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<'gpt-5' | 'gpt-5-mini' | 'gpt-4o-mini'>('gpt-4o-mini');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState<CorrectionResponse['meta'] | null>(null);
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    const savedModel = localStorage.getItem('openai-model') as 'gpt-5' | 'gpt-5-mini' | 'gpt-4o-mini' | null;
    if (savedModel && (savedModel === 'gpt-5' || savedModel === 'gpt-5-mini' || savedModel === 'gpt-4o-mini')) {
      setModel(savedModel);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
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

  const modelOptions = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5', label: 'GPT-5' },
  ] as const;

  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    if (newApiKey) {
      localStorage.setItem('openai-api-key', newApiKey);
    } else {
      localStorage.removeItem('openai-api-key');
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
      setIsAPIModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setOutputText('');
    setMeta(null);

    const startTime = Date.now();

    try {
      // In Tauri, call OpenAI directly since static export doesn't support API routes
      if (isTauri()) {
        const corrector = new OpenAICorrector(apiKey, model);
        const result = await corrector.correct({
          text: inputText,
        });

        const duration = Date.now() - startTime;

        setOutputText(result.result);
        setMeta({
          duration,
          model: model,
          provider: 'openai',
        });
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
        onSettingsClick={() => setIsAPIModalOpen(true)}
        hasApiKey={!!apiKey}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <APIModal
        isOpen={isAPIModalOpen}
        onClose={() => setIsAPIModalOpen(false)}
        onSave={handleSaveApiKey}
        currentApiKey={apiKey}
      />

      <main className="min-h-screen flex justify-center p-6 bg-background dark:bg-gray-950 pt-20 transition-colors mt-6">
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="input" className="block text-sm font-medium dark:text-gray-200">
                  Text to correct
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="model" className="text-xs font-medium text-foreground/60 dark:text-gray-400">
                    Model:
                  </label>
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground/70 dark:text-gray-300 bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                      disabled={isLoading}
                    >
                      <span className="flex-1 text-left">{modelOptions.find(option => option.value === model)?.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isModelDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg z-10">
                        {modelOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleModelChange(option.value)}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg ${
                              model === option.value
                                ? 'bg-primary text-white'
                                : 'text-foreground dark:text-gray-100 hover:bg-foreground/5 dark:hover:bg-white/5'
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
              <textarea
                ref={textareaRef}
                id="input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter text to correct..."
                className="w-full h-96 px-4 py-3 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground dark:text-gray-100 transition-colors"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Correcting...' : 'Correct'}
            </button>

            <div className="flex items-center justify-center gap-4 text-sm text-foreground/60 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 rounded text-xs font-medium flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <CornerDownLeft className="w-3 h-3" />
                </kbd>
                <span className="text-xs">Mac</span>
              </div>
              <span className="text-foreground/30 dark:text-gray-600">or</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 rounded text-xs font-medium">
                  Ctrl+Enter
                </kbd>
                <span className="text-xs">Win/Linux</span>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {outputText && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium dark:text-gray-200">
                    Corrected text
                  </label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-white bg-foreground/5 dark:bg-white/5 hover:bg-foreground/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Copy to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg min-h-[12rem] transition-colors">
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {outputText}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {meta && (
                <div className="flex items-center justify-between text-xs text-foreground/60 dark:text-gray-400">
                  <span>
                    Model: {meta.model}
                  </span>
                  {meta.duration && (
                    <span>Duration: {(meta.duration / 1000).toFixed(2)}s</span>
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
