'use client';

import { X, KeyRound, FileText, Bot, Keyboard, Lightbulb, AlertCircle, HelpCircle } from 'lucide-react';
import { isTauri } from '@/lib/utils';
import { useLocale } from '@/lib/useLocale';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { messages } = useLocale();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <HelpCircle className="w-5 h-5 text-primary dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold dark:text-white">{messages.helpModal.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={messages.helpModal.close}
          >
            <X className="w-5 h-5 text-foreground/60 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              {messages.helpModal.apiKeySetup}
            </h3>
            <div className="space-y-3 text-sm text-foreground/80 dark:text-gray-300">
              <p>
                {messages.helpModal.apiKeyDescription}
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  {messages.helpModal.apiKeyStep1}{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {messages.helpModal.apiKeyStep1Link}
                  </a>
                </li>
                <li>{messages.helpModal.apiKeyStep2}</li>
                <li>{messages.helpModal.apiKeyStep3}</li>
                <li>{messages.helpModal.apiKeyStep4}</li>
                <li>{messages.helpModal.apiKeyStep5}</li>
              </ol>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-800 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>{messages.helpModal.apiKeyNote}</strong> {messages.helpModal.apiKeyNoteText}
                </p>
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {messages.helpModal.howToUse}
            </h3>
            <div className="space-y-4 text-sm text-foreground/80 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-foreground dark:text-white mb-2">{messages.helpModal.inAppCorrection}</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>{messages.helpModal.inAppStep1}</li>
                  <li>{messages.helpModal.inAppStep2} <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+Enter</kbd> (Mac) {messages.home.shortcutOr} <kbd className="px-1.5 py-0.5 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+Enter</kbd> (Windows/Linux)</li>
                  <li>{messages.helpModal.inAppStep3}</li>
                  <li>{messages.helpModal.inAppStep4}</li>
                </ol>
              </div>

              {isTauri() && (
                <div>
                  <h4 className="font-medium text-foreground dark:text-white mb-2">
                    {messages.helpModal.globalShortcut}
                  </h4>
                  <p className="mb-2">
                    {messages.helpModal.globalShortcutDescription}
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
                      <strong>{messages.helpModal.globalShortcutTip}</strong> {messages.helpModal.globalShortcutTipText}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mt-3 flex gap-2">
                    <Keyboard className="w-4 h-4 text-purple-800 dark:text-purple-300 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-800 dark:text-purple-300">
                      <strong>{messages.helpModal.globalShortcutCustomization}</strong> {messages.helpModal.globalShortcutCustomizationText}
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
              {messages.helpModal.modelSelection}
            </h3>
            <div className="space-y-2 text-sm text-foreground/80 dark:text-gray-300">
              <p>{messages.helpModal.modelSelectionDescription}</p>
              <ul className="space-y-2 ml-2">
                <li>
                  <strong className="text-foreground dark:text-white">{messages.helpModal.model1Name}</strong> {messages.helpModal.model1Description}
                </li>
                <li>
                  <strong className="text-foreground dark:text-white">{messages.helpModal.model2Name}</strong> {messages.helpModal.model2Description}
                </li>
                <li>
                  <strong className="text-foreground dark:text-white">{messages.helpModal.model3Name}</strong> {messages.helpModal.model3Description}
                </li>
              </ul>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              {messages.helpModal.keyboardShortcuts}
            </h3>
            <div className="space-y-2 text-sm text-foreground/80 dark:text-gray-300">
              <div className="flex justify-between items-center p-2 bg-foreground/5 dark:bg-white/5 rounded">
                <span>{messages.helpModal.shortcutSubmit}</span>
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Cmd+Enter</kbd>
                  <span className="text-foreground/40">or</span>
                  <kbd className="px-2 py-1 bg-foreground/10 dark:bg-white/10 rounded text-xs font-medium">Ctrl+Enter</kbd>
                </div>
              </div>
              {isTauri() && (
                <div className="flex justify-between items-center p-2 bg-foreground/5 dark:bg-white/5 rounded">
                  <span>{messages.helpModal.shortcutGlobal} <span className="text-foreground/50 text-xs">(customizable)</span></span>
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
            {messages.helpModal.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
