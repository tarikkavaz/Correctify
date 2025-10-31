"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load saved theme from localStorage
    // Only load if a saved preference exists (for backward compatibility)
    // If no saved theme exists, keep default "system" without saving it
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    // If no saved theme, theme stays as "system" (default), but we don't save it
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Determine which theme to apply
    let effectiveTheme: "light" | "dark" = "light";

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      effectiveTheme = systemTheme;
    } else {
      effectiveTheme = theme;
    }

    // Apply theme class
    root.classList.add(effectiveTheme);
    setResolvedTheme(effectiveTheme);

    // Only save to localStorage when theme is explicitly "light" or "dark"
    // Don't save "system" automatically - it's only the default for first-time users
    if (theme === "light" || theme === "dark") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      // If currently on system (first-time user), switch to light
      if (prev === "system") return "light";
      // Otherwise, toggle between light and dark only (skip system)
      if (prev === "light") return "dark";
      return "light";
    });
  };

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
