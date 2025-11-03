"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Always force dark mode
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("dark");
    setResolvedTheme("dark");
  }, []);

  const toggleTheme = () => {
    // Disabled - do nothing
  };

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
