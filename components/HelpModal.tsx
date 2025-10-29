'use client';

import { X, KeyRound, FileText, Bot, Keyboard, Lightbulb, AlertCircle, HelpCircle, Palette } from 'lucide-react';
import { isTauri } from '@/lib/utils';
import { useLocale } from '@/lib/useLocale';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcutKey: string;
}

export default function HelpModal({ isOpen, onClose, shortcutKey }: HelpModalProps) {
  const { messages } = useLocale();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{backgroundColor: 'var(--color-modal-backdrop)'}}>
      <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{messages.helpModal.title}</h2>
          </div>
          <button
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
                Correctify v1.1.0 supports <strong>4 LLM providers</strong> with 14 total models (10 paid, 4 free). You can add API keys for any or all providers.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Supported Providers:</h4>
                <ul className="space-y-2 ml-2">
                  <li>
                    <strong>OpenAI</strong> - GPT-4o, GPT-4o Mini{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      (Get API Key →)
                    </a>
                  </li>
                  <li>
                    <strong>Anthropic</strong> - Claude 3.5 Sonnet, Claude 3.5 Haiku{' '}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      (Get API Key →)
                    </a>
                  </li>
                  <li>
                    <strong>Mistral</strong> - Mistral Large, Mistral Small{' '}
                    <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      (Get API Key →)
                    </a>
                  </li>
                  <li>
                    <strong>OpenRouter</strong> - 4 FREE models (Llama 3.2 3B, Gemma 2 9B, Phi-3 Mini, Mistral 7B){' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                      (Get FREE API Key →)
                    </a>
                    <div className="text-xs text-foreground/70 mt-1">
                      Free models available - No credit card required!
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-success-bg border border-success-border rounded-lg mt-3 flex gap-2">
                <Lightbulb className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-success-text">
                  <strong>Want to try for free?</strong>
                  <p className="mt-1">Create a free OpenRouter account and get instant access to 4 free models without adding a credit card. Perfect for testing Correctify!</p>
                </div>
              </div>

              <div className="p-3 bg-info-bg border border-info-border rounded-lg mt-3 flex gap-2">
                <KeyRound className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-info-text">
                  <strong>Secure Storage (v1.1.0):</strong>
                  <p className="mt-1">API keys are now stored with OS-level encryption in your device's secure app data directory. Keys are never sent to any server except directly to your chosen LLM provider.</p>
                  <p className="mt-1 font-mono text-[10px] opacity-70">
                    Storage: ~/.Library/Application Support/com.correctify/.keys/ (macOS)
                  </p>
                </div>
              </div>

              <div className="p-3 bg-warning-bg border border-warning-border rounded-lg mt-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-warning-text flex-shrink-0 mt-0.5" />
                <p className="text-xs text-warning-text">
                  <strong>{messages.helpModal.apiKeyNote}</strong> {messages.helpModal.apiKeyNoteText}
                </p>
              </div>
            </div>
          </section>

          {/* How to Use Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {messages.helpModal.howToUse}
            </h3>
            <div className="space-y-4 text-sm text-foreground/80">
              <div>
                <h4 className="font-medium text-foreground mb-2">{messages.helpModal.inAppCorrection}</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>{messages.helpModal.inAppStep1}</li>
                  <li>{messages.helpModal.inAppStep2} <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+Enter</kbd> (Mac) {messages.home.shortcutOr} <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+Enter</kbd> (Windows/Linux)</li>
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
                  
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-foreground mb-1">With Auto Copy/Paste (Recommended):</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                      <li>Select text in any app (just highlight, no copying needed)</li>
                      <li>
                        Press{' '}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+Shift+{shortcutKey}</kbd> (Mac) or{' '}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+Shift+{shortcutKey}</kbd> (Windows/Linux)
                      </li>
                      <li>Wait for the notification - corrected text pastes automatically!</li>
                    </ol>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Without Auto Copy/Paste (Manual Mode):</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                      <li>
                        Select and copy text in any app (
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+C</kbd> or{' '}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+C</kbd>)
                      </li>
                      <li>
                        Press{' '}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+Shift+{shortcutKey}</kbd> (Mac) or{' '}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+Shift+{shortcutKey}</kbd> (Windows/Linux)
                      </li>
                      <li>Wait for the notification (you'll see "Processing...")</li>
                      <li>
                        Paste the corrected text (
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Cmd+V</kbd> or{' '}
                        <kbd className="px-1.5 py-0.5 bg-foreground/10 rounded text-xs font-medium">Ctrl+V</kbd>)
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-info-bg border border-info-border rounded-lg mt-3 flex gap-2">
                    <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-info-text">
                      <strong>{messages.helpModal.globalShortcutTip}</strong> {messages.helpModal.globalShortcutTipText}
                    </p>
                  </div>
                  <div className="p-3 bg-success-bg border border-success-border rounded-lg mt-3 flex gap-2">
                    <Keyboard className="w-4 h-4 text-success-text flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-success-text">
                      <strong>{messages.helpModal.globalShortcutCustomization}</strong> {messages.helpModal.globalShortcutCustomizationText}
                    </p>
                  </div>
                  <div className="p-3 bg-warning-bg border border-warning-border rounded-lg mt-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-warning-text flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-text">
                      <strong>macOS Accessibility Permissions:</strong> If using Auto Copy/Paste, you must grant Accessibility permissions to Correctify. Go to System Settings &gt; Privacy &amp; Security &gt; Accessibility and enable Correctify. This allows the app to simulate keyboard input for seamless text correction.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Model Selection */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {messages.helpModal.modelSelection}
            </h3>
            <div className="space-y-3 text-sm text-foreground/80">
              <p>Correctify now supports 14 models across 4 providers. Models are grouped by category:</p>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Paid Models (API key + usage costs):</h4>
                <ul className="space-y-1.5 ml-2">
                  <li><strong>GPT-5</strong> - Most advanced reasoning</li>
                  <li><strong>GPT-5 Mini</strong> - Balanced performance</li>
                  <li><strong>GPT-4o Mini</strong> - Fast, affordable, recommended for most users</li>
                  <li><strong>GPT-4o</strong> - Most advanced OpenAI model</li>
                  <li><strong>GPT-4 Turbo</strong> - Powerful and versatile</li>
                  <li><strong>GPT-3.5 Turbo</strong> - Very affordable and fast</li>
                  <li><strong>Claude 3.5 Sonnet</strong> - Intelligent, balanced</li>
                  <li><strong>Claude 3.5 Haiku</strong> - Fast, compact</li>
                  <li><strong>Mistral Large</strong> - Most capable Mistral</li>
                  <li><strong>Mistral Small</strong> - Optimized performance</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Free Models (OpenRouter key required, no usage costs):</h4>
                <ul className="space-y-1.5 ml-2">
                  <li><strong>Llama 3.2 3B</strong> - Fast, lightweight</li>
                  <li><strong>Gemma 2 9B</strong> - Google's open model</li>
                  <li><strong>Phi-3 Mini</strong> - Microsoft research</li>
                  <li><strong>Mistral 7B</strong> - Open source</li>
                </ul>
              </div>

              <div className="p-3 bg-info-bg border border-info-border rounded-lg flex gap-2">
                <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-info-text">
                  <strong>Smart Fallback:</strong>
                  <p className="mt-1">If a paid model fails (e.g., insufficient credits), Correctify will offer to retry with a free OpenRouter model automatically.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Writing Style Selection */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Writing Style Selection
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <p>Choose from 5 different writing styles to customize how your text is corrected and rewritten:</p>
              <ul className="space-y-2 ml-2">
                <li>
                  <strong className="text-foreground">Grammar Only</strong> - Fixes grammar and typos only (default behavior)
                </li>
                <li>
                  <strong className="text-foreground">Formal</strong> - Professional tone with no contractions, suitable for business or academic writing
                </li>
                <li>
                  <strong className="text-foreground">Informal</strong> - Conversational and friendly tone with natural phrasing
                </li>
                <li>
                  <strong className="text-foreground">Collaborative</strong> - Inclusive team-oriented language with cooperative phrasing
                </li>
                <li>
                  <strong className="text-foreground">Concise</strong> - Brief and to the point, removing redundancy while maintaining meaning
                </li>
              </ul>
              <div className="p-3 bg-info-bg border border-info-border rounded-lg mt-3 flex gap-2">
                <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <p className="text-xs text-info-text">
                  <strong>Note:</strong> Your selected writing style persists across sessions and is used for both in-app corrections and global shortcut corrections.
                </p>
              </div>
            </div>
          </section>

          {/* Usage Tracking */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Usage Statistics (v1.1.0)
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <p>Track your LLM usage with built-in analytics. Click the <strong>Usage Stats</strong> button in the header menu to view:</p>
              <ul className="space-y-1.5 ml-2">
                <li>Total requests and success rate</li>
                <li>Average response time per model</li>
                <li>Estimated cost breakdown by provider</li>
                <li>Token usage statistics</li>
                <li>Filterable by time period (7/30/90 days, or all time)</li>
              </ul>
              <div className="p-3 bg-info-bg border border-info-border rounded-lg flex gap-2">
                <Lightbulb className="w-4 h-4 text-info-text flex-shrink-0 mt-0.5" />
                <div className="text-xs text-info-text">
                  <strong>Privacy:</strong> All usage data is stored locally on your device and never shared with any server.
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              {messages.helpModal.keyboardShortcuts}
            </h3>
            <div className="space-y-2 text-sm text-foreground/80">
              <div className="flex justify-between items-center p-2 bg-foreground/5 rounded">
                <span>{messages.helpModal.shortcutSubmit}</span>
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-foreground/10 rounded text-xs font-medium">Cmd+Enter</kbd>
                  <span className="text-foreground/40">or</span>
                  <kbd className="px-2 py-1 bg-foreground/10 rounded text-xs font-medium">Ctrl+Enter</kbd>
                </div>
              </div>
              {isTauri() && (
                <div className="flex justify-between items-center p-2 bg-foreground/5 rounded">
                  <span>{messages.helpModal.shortcutGlobal} <span className="text-foreground/50 text-xs">(customizable)</span></span>
                  <div className="flex gap-2">
                    <kbd className="px-2 py-1 bg-foreground/10 rounded text-xs font-medium">Cmd+Shift+{shortcutKey}</kbd>
                    <span className="text-foreground/40">or</span>
                    <kbd className="px-2 py-1 bg-foreground/10 rounded text-xs font-medium">Ctrl+Shift+{shortcutKey}</kbd>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
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
