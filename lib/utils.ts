/**
 * Detect if the app is running inside Tauri
 * Checks multiple indicators since Tauri 2 uses different protocols and globals
 */
export function isTauri(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Tauri-specific globals and protocols
  return (
    "__TAURI__" in window ||
    "__TAURI_INTERNALS__" in window ||
    window.location.protocol === "tauri:" ||
    window.location.protocol === "file:" ||
    "__TAURI_METADATA__" in (window as unknown as Record<string, unknown>)
  );
}

/**
 * Detect if the app is running on macOS
 */
export function isMacOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return navigator.platform.toLowerCase().includes("mac");
}
