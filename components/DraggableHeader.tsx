"use client";

import { useLocale } from "@/lib/useLocale";
import type { Theme } from "@/lib/useTheme";
import {
  BarChart3,
  HelpCircle,
  Info,
  Monitor,
  Moon,
  MoreVertical,
  RefreshCcw,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DraggableHeaderProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onUsageClick: () => void;
  onAboutClick: () => void;
  onReloadClick: () => void;
  onQuitClick: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export default function DraggableHeader({
  onSettingsClick,
  onHelpClick,
  onUsageClick,
  onAboutClick,
  onReloadClick,
  onQuitClick,
  theme,
  onThemeToggle,
}: DraggableHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ThemeIcon = theme === "system" ? Monitor : theme === "dark" ? Moon : Sun;
  const { messages } = useLocale();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-4 bg-background/80 backdrop-blur-sm border-b border-border z-40 transition-colors"
    >
      <div data-tauri-drag-region className="flex-1" />
      <div
        data-tauri-drag-region
        className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2 select-none cursor-default"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-tauri-drag-region src="/logo.png" alt="Correctify Logo" className="w-10 h-10" />
        <div data-tauri-drag-region>
          <h1 data-tauri-drag-region className="text-xl font-bold text-foreground">
            Correctify
          </h1>
          <p data-tauri-drag-region className="text-xs text-text-muted">
            {messages.header.subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <div className="relative flex flex-col items-center group">
          <button
            type="button"
            onClick={onThemeToggle}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.header.theme}
          >
            <ThemeIcon className="w-5 h-5 text-text-muted hover:text-foreground transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-tooltip-bg" />
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-text-on-primary whitespace-nowrap bg-tooltip-bg shadow-lg rounded">
              {messages.header.theme}
            </span>
          </div>
        </div>

        {/* Reload */}
        <div className="relative flex flex-col items-center group">
          <button
            type="button"
            onClick={onReloadClick}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.header.reload}
          >
            <RefreshCcw className="w-5 h-5 text-text-muted hover:text-foreground transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-tooltip-bg" />
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-text-on-primary whitespace-nowrap bg-tooltip-bg shadow-lg rounded">
              {messages.header.reload}
            </span>
          </div>
        </div>

        {/* Settings */}
        <div className="relative flex flex-col items-center group">
          <button
            type="button"
            onClick={onSettingsClick}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.header.settings}
          >
            <Settings className="w-5 h-5 text-text-muted hover:text-foreground transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-tooltip-bg" />
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-text-on-primary whitespace-nowrap bg-tooltip-bg shadow-lg rounded">
              {messages.header.settings}
            </span>
          </div>
        </div>

        {/* More Menu */}
        <div className="relative flex flex-col items-center group" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            aria-label={messages.header.menu}
          >
            <MoreVertical className="w-5 h-5 text-text-muted hover:text-foreground transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-tooltip-bg" />
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-text-on-primary whitespace-nowrap bg-tooltip-bg shadow-lg rounded">
              {messages.header.menu}
            </span>
          </div>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-card-bg border border-border rounded-lg shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  onAboutClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-foreground/5 transition-colors first:rounded-t-lg"
              >
                <Info className="w-4 h-4" />
                <span>{messages.header.about}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onHelpClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-foreground/5 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{messages.header.help}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUsageClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-foreground/5 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{messages.header.usageStats}</span>
              </button>

              <div className="border-t border-border" />

              <button
                type="button"
                onClick={() => {
                  onQuitClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error-text hover:bg-error-bg transition-colors last:rounded-b-lg"
              >
                <X className="w-4 h-4" />
                <span>{messages.header.quit}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
