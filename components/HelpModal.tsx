'use client';

import { X, Key, FileText, Bot, Keyboard, Lightbulb, AlertCircle, HelpCircle } from 'lucide-react';
import { isTauri } from '@/lib/utils';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <HelpCircle className="w-5 h-5 text-primary dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold dark:text-white">Help & Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground/60 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key Setup
            </h3>
            <div className="space-y-3 text-sm text-foreground/80 dark:text-gray-300">
              <p>
                Correctify uses OpenAI's API to provide grammar corrections. You need to provide your own API key to use the app.
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  Go to{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    OpenAI API Keys page
                  </a>
                </li>
                <li>Sign in or create an account if you don't have one</li>
                <li>Click "Create new secret key" and copy it</li>
                <li>Click the key icon in the top-right corner of this app</li>
                <li>Paste your API key and save</li>
              </ol>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-800 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> Your API key is stored locally on your device and never sent to any server other than OpenAI's API.
                </p>
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              How to Use
            </h3>
            <div className="space-y-4 text-sm text-foreground/80 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-foreground dark:text-white mb-2">In-App Correction</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Type or paste text in the input field</li>
                  <li>Click "Correct" or press <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+Enter</kbd> (Mac) or <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+Enter</kbd> (Windows/Linux)</li>
                  <li>Review the corrected text</li>
                  <li>Click "Copy" to copy to clipboard</li>
                </ol>
              </div>

              {isTauri() && (
                <div>
                  <h4 className="font-medium text-foreground dark:text-white mb-2">
                    Global Shortcut (Desktop App Only)
                  </h4>
                  <p className="mb-2">
                    Correct text from any application using the global shortcut:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>
                      Select and copy text in any app (
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+C</kbd> or{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+C</kbd>)
                    </li>
                    <li>
                      Press{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+Shift+.</kbd> (Mac) or{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+Shift+.</kbd> (Windows/Linux)
                    </li>
                    <li>Wait for the notification (you'll see "Processing...")</li>
                    <li>
                      Paste the corrected text (
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+V</kbd> or{' '}
                      <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+V</kbd>)
                    </li>
                  </ol>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-3 flex gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-800 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <strong>Tip:</strong> The global shortcut works even when the app is minimized or in the background!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Model Selection */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Model Selection
            </h3>
            <div className="space-y-2 text-sm text-foreground/80 dark:text-gray-300">
              <p>Choose the AI model that best fits your needs:</p>
              <ul className="space-y-2 ml-2">
                <li>
                  <strong className="text-foreground dark:text-white">GPT-4o Mini:</strong> Fast and cost-effective. Great for most corrections.
                </li>
                <li>
                  <strong className="text-foreground dark:text-white">GPT-5 Mini:</strong> More advanced. Better at complex grammar and style.
                </li>
                <li>
                  <strong className="text-foreground dark:text-white">GPT-5:</strong> Most powerful. Best for nuanced corrections and tone adjustments.
                </li>
              </ul>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm text-foreground/80 dark:text-gray-300">
              <div className="flex justify-between items-center p-2 bg-foreground/5 dark:bg-white/5 rounded">
                <span>Submit for correction</span>
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+Enter</kbd>
                  <span className="text-foreground/40">or</span>
                  <kbd className="px-2 py-1 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+Enter</kbd>
                </div>
              </div>
              {isTauri() && (
                <div className="flex justify-between items-center p-2 bg-foreground/5 dark:bg-white/5 rounded">
                  <span>Global correction shortcut</span>
                  <div className="flex gap-2">
                    <kbd className="px-2 py-1 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+Shift+.</kbd>
                    <span className="text-foreground/40">or</span>
                    <kbd className="px-2 py-1 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+Shift+.</kbd>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
