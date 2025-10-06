'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import { open } from '@tauri-apps/plugin-shell';

export default function AboutPage() {
  const version = '0.1.0';
  const [mounted, setMounted] = useState(false);
  
  // Apply theme to this window
  useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenGitHub = async () => {
    try {
      await open('https://github.com/tarikkavaz/Correctify');
    } catch (error) {
      console.error('Failed to open GitHub URL:', error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950 overflow-hidden">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Correctify
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered grammar correction
          </p>
        </div>

        {/* Version Info */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Version {version}</p>
          
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            A privacy-focused grammar correction tool that uses AI to improve your writing 
            while keeping your data secure.
          </p>
        </div>

        {/* GitHub Link */}
        <div>
          <button 
            onClick={handleOpenGitHub}
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 text-xs text-gray-500 dark:text-gray-500">
          <p>© 2025 Correctify</p>
          <p className="mt-1">Built with Next.js and Tauri</p>
        </div>
      </div>
    </div>
  );
}
