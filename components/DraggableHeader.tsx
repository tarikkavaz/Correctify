'use client';

import { Settings, Sun, Moon, Monitor, HelpCircle, Info, RefreshCcw } from 'lucide-react';
import { Theme } from '@/lib/useTheme';
import { useLocale } from '@/lib/useLocale';

interface DraggableHeaderProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onAboutClick: () => void;
  onReloadClick: () => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export default function DraggableHeader({
  onSettingsClick,
  onHelpClick,
  onAboutClick,
  onReloadClick,
  theme,
  onThemeToggle,
}: DraggableHeaderProps) {
  const ThemeIcon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;
  const { messages } = useLocale();

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-4 bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-border dark:border-gray-700 z-40 transition-colors"
    >
      <div data-tauri-drag-region className="flex-1" />
      <div data-tauri-drag-region className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2 select-none">
        <img 
          data-tauri-drag-region
          src="/logo.png" 
          alt="Correctify Logo" 
          className="w-10 h-10"
        />
        <div data-tauri-drag-region>
          <h1 data-tauri-drag-region className="text-xl font-bold dark:text-white">Correctify</h1>
          <p data-tauri-drag-region className="text-xs text-foreground/60 dark:text-gray-400">
            {messages.header.subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex flex-col items-center group">
          <button
            onClick={onAboutClick}
            className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={messages.header.about}
          >
            <Info className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800 dark:bg-gray-700"></div>
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-white whitespace-nowrap bg-gray-800 dark:bg-gray-700 shadow-lg rounded">
              {messages.header.about}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col items-center group">
          <button
            onClick={onHelpClick}
            className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={messages.header.help}
          >
            <HelpCircle className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800 dark:bg-gray-700"></div>
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-white whitespace-nowrap bg-gray-800 dark:bg-gray-700 shadow-lg rounded">
              {messages.header.help}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col items-center group">
          <button
            onClick={onThemeToggle}
            className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={messages.header.theme}
          >
            <ThemeIcon className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800 dark:bg-gray-700"></div>
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-white whitespace-nowrap bg-gray-800 dark:bg-gray-700 shadow-lg rounded">
              {messages.header.theme}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col items-center group">
          <button
            onClick={onReloadClick}
            className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={messages.header.reload}
          >
            <RefreshCcw className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800 dark:bg-gray-700"></div>
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-white whitespace-nowrap bg-gray-800 dark:bg-gray-700 shadow-lg rounded">
              {messages.header.reload}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col items-center group">
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-foreground/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            aria-label={messages.header.settings}
          >
            <Settings className="w-5 h-5 text-foreground/60 dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors" />
          </button>
          <div className="absolute top-0 hidden items-center mt-10 group-hover:flex group-hover:flex-col">
            <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800 dark:bg-gray-700"></div>
            <span className="relative z-10 px-2 py-1 text-xs leading-none text-white whitespace-nowrap bg-gray-800 dark:bg-gray-700 shadow-lg rounded">
              {messages.header.settings}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
