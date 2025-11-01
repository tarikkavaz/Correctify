"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import de from "./locales/de.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import tr from "./locales/tr.json";

export type Locale = "en" | "de" | "fr" | "tr";
export type Messages = typeof en;

const locales: Record<Locale, Messages> = {
  en,
  de,
  fr,
  tr,
};

function getSystemLocale(): Locale {
  if (typeof window === "undefined") return "en";

  // Check for app-language setting (user preference)
  const appLanguage = localStorage.getItem("app-language");
  if (appLanguage && appLanguage !== "system" && ["en", "de", "fr", "tr"].includes(appLanguage)) {
    return appLanguage as Locale;
  }

  // If app-language is "system" or not set, use system detection
  // Check for environment variable (for Tauri dev testing)
  // Usage: NEXT_PUBLIC_DEV_LOCALE=de pnpm tauri:dev
  const envLocale = process.env.NEXT_PUBLIC_DEV_LOCALE;
  if (envLocale && ["en", "de", "fr", "tr"].includes(envLocale)) {
    console.log("🌍 Using locale from environment:", envLocale);
    return envLocale as Locale;
  }

  // Check for URL query parameter (for testing: ?locale=de)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocale = urlParams.get("locale");
  if (urlLocale && ["en", "de", "fr", "tr"].includes(urlLocale)) {
    return urlLocale as Locale;
  }

  // Check localStorage override (for persistent testing - legacy)
  const savedLocale = localStorage.getItem("dev-locale");
  if (savedLocale && ["en", "de", "fr", "tr"].includes(savedLocale)) {
    return savedLocale as Locale;
  }

  const browserLang = navigator.language.toLowerCase();

  // Map browser language codes to supported locales
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("tr")) return "tr";

  // Default to English
  return "en";
}

interface LocaleContextType {
  locale: Locale;
  messages: Messages;
  changeLocale: (newLocale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [messages, setMessages] = useState<Messages>(en);

  useEffect(() => {
    const systemLocale = getSystemLocale();
    setLocale(systemLocale);
    setMessages(locales[systemLocale]);
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setMessages(locales[newLocale]);
    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("app-language", newLocale);
    }
  };

  const contextValue: LocaleContextType = {
    locale,
    messages,
    changeLocale,
  };

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
