import type { Preset } from "./types";

const STORAGE_KEY = "correctify_presets_v1";

export function getPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Preset[]; } catch { return []; }
}

export function savePreset(preset: Preset): Preset[] {
  const presets = getPresets();
  const index = presets.findIndex((item) => item.id === preset.id);
  if (index === -1) presets.push(preset); else presets[index] = preset;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}

export function deletePreset(id: string): Preset[] {
  const presets = getPresets().filter((preset) => preset.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}
