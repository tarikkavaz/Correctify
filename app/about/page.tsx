'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import { useLocale } from '@/lib/useLocale';
import { open } from '@tauri-apps/plugin-shell';
import packageJson from '@/package.json';

export default function AboutPage() {
  const version = packageJson.version;
  const [mounted, setMounted] = useState(false);
  const { messages } = useLocale();
  
  // Apply theme to this window
  useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenHomepage = async () => {
    try {
      await open('https://tarikkavaz.github.io/Correctify/');
    } catch (error) {
      console.error('Failed to open homepage URL:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen flex items-center justify-center p-8 bg-background overflow-hidden">
      <div className="max-w-md w-full text-center space-y-6">
        {/* App Icon */}
        <div className="flex justify-center">
          <img 
            src="/logo.png" 
            alt="Correctify Logo" 
            className="w-24 h-24"
          />
        </div>

        {/* App Name */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {messages.about.title}
          </h1>
          <p className="text-text-muted mt-2">
            {messages.about.subtitle}
          </p>
        </div>

        {/* Version Info */}
        <div className="space-y-2 text-sm text-text-muted">
          <p>{messages.about.version} {version}</p>
          
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-divider">
          <p className="text-sm text-text-muted leading-relaxed">
            {messages.about.description}
          </p>
        </div>

        {/* Homepage Link */}
        <div>
          <button 
            onClick={handleOpenHomepage}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            {messages.about.visitHomepage}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 text-xs text-text-muted">
          <p>{messages.about.copyright}</p>
          <p className="mt-1">{messages.about.builtWith}</p>
        </div>
      </div>
    </div>
  );
}
