import { useEffect, useState } from "react";
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

  // Check localStorage override (for persistent testing)
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

export function useLocale() {
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
  };

  return { locale, messages, changeLocale };
}
