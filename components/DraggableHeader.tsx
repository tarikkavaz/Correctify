'use client';

import { KeyRound, Sun, Moon, Monitor, HelpCircle } from 'lucide-react';
import { Theme } from '@/lib/useTheme';

interface DraggableHeaderProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export default function DraggableHeader({
  onSettingsClick,
  onHelpClick,
  theme,
  onThemeToggle,
}: DraggableHeaderProps) {
  const ThemeIcon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-4 bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-border dark:border-gray-700 z-40 transition-colors"
    >
      <div data-tauri-drag-region className="flex-1" />
      <div data-tauri-drag-region className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
        <img 
          src="/logo.png" 
          alt="Correctify Logo" 
          className="w-10 h-10"
        />
        <div className="">
          <h1 className="text-xl font-bold dark:text-white">Correctify</h1>
          <p className="text-xs text-foreground/60 dark:text-gray-400">
            AI-powered grammar correction
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onHelpClick}
          className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Help"
          title="Help"
        >
          <HelpCircle className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
        </button>
        <button
          onClick={onThemeToggle}
          className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          aria-label={`Theme: ${theme}`}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
        </button>
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <KeyRound className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
        </button>
      </div>
    </div>
  );
}
