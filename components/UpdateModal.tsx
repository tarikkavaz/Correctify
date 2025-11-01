"use client";

import { Download, Loader2, X } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import ReactMarkdown from "react-markdown";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  version: string;
  releaseNotes: string;
  isDownloading?: boolean;
  isInstalling?: boolean;
}

export default function UpdateModal({
  isOpen,
  onClose,
  onInstall,
  version,
  releaseNotes,
  isDownloading = false,
  isInstalling = false,
}: UpdateModalProps) {
  const { messages } = useLocale();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: "var(--color-modal-backdrop)" }}
    >
      <div className="relative w-full max-w-md mx-4 bg-card-bg rounded-lg shadow-xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {messages.updateModal?.title || "Update Available"}
            </h2>
          </div>
          {!isDownloading && !isInstalling && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-foreground/5 rounded-lg transition-colors"
              aria-label={messages.updateModal?.closeAriaLabel || "Close update dialog"}
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-foreground">
            {messages.updateModal?.description?.replace("{version}", version) || `Update to ${version} is available!`}
          </p>

          {releaseNotes && (
            <div className="border border-border rounded-lg p-4 bg-foreground/5 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {messages.updateModal?.releaseNotes || "Release Notes"}
              </h3>
              <div className="text-sm text-foreground/80 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-ul:text-foreground/80 prose-li:text-foreground/80 prose-h2:text-foreground prose-h3:text-foreground">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground/80">{children}</p>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h3>,
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-1 text-foreground/80">{children}</ul>
                    ),
                    li: ({ children }) => <li className="text-sm text-foreground/80">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                  }}
                >
                  {releaseNotes}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {(isDownloading || isInstalling) && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm text-foreground">
                {isDownloading
                  ? messages.updateModal?.downloading || "Downloading update..."
                  : messages.updateModal?.installing || "Installing update..."}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isDownloading && !isInstalling && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
            >
              {messages.updateModal?.later || "Later"}
            </button>
            <button
              type="button"
              onClick={onInstall}
              className="px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-lg hover:bg-primary/90 transition-colors"
            >
              {messages.updateModal?.installNow || "Install Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
