import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./utils";

/**
 * Secure storage wrapper for API keys using OS-level secure storage
 * - macOS: Keychain
 * - Windows: DPAPI
 * - Linux: System keyring
 *
 * In web mode (non-Tauri), falls back to localStorage
 */

const KEY_PREFIX = "correctify_";

/**
 * Get a key from secure storage (or localStorage in web mode)
 */
export async function getKey(key: string): Promise<string | null> {
  // In web mode, use localStorage as fallback
  if (!isTauri()) {
    return localStorage.getItem(key);
  }

  try {
    const fullKey = `${KEY_PREFIX}${key}`;
    const value = await invoke<string>("secure_storage_get", {
      key: fullKey,
    });
    return value || null;
  } catch (error) {
    // Key might not exist yet, which is not an error
    return null;
  }
}

/**
 * Set a key in secure storage (or localStorage in web mode)
 */
export async function setKey(key: string, value: string): Promise<void> {
  // In web mode, use localStorage as fallback
  if (!isTauri()) {
    localStorage.setItem(key, value);
    return;
  }

  try {
    const fullKey = `${KEY_PREFIX}${key}`;
    await invoke("secure_storage_set", {
      key: fullKey,
      value,
    });
  } catch (error) {
    console.error(`Failed to save ${key} to secure storage:`, error);
    throw new Error(`Failed to save ${key} to secure storage`);
  }
}

/**
 * Delete a key from secure storage (or localStorage in web mode)
 */
export async function deleteKey(key: string): Promise<void> {
  // In web mode, use localStorage as fallback
  if (!isTauri()) {
    localStorage.removeItem(key);
    return;
  }

  try {
    await invoke("secure_storage_remove", {
      key: `${KEY_PREFIX}${key}`,
    });
  } catch (error) {
    console.error(`Failed to delete key "${key}" from secure storage:`, error);
    throw new Error(`Failed to remove ${key} from secure storage`);
  }
}

/**
 * Check if a key exists in secure storage
 */
export async function hasKey(key: string): Promise<boolean> {
  try {
    const value = await getKey(key);
    return value !== null && value.trim().length > 0;
  } catch (error) {
    console.error(`Failed to check if key "${key}" exists:`, error);
    return false;
  }
}

/**
 * Migrate API keys from localStorage to secure storage
 * This is a one-time migration that runs on app startup
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const MIGRATION_FLAG = "MIGRATION_COMPLETE_V1_1_0";

  // Check if migration has already been completed
  if (localStorage.getItem(MIGRATION_FLAG) === "true") {
    return;
  }

  const keysToMigrate = [
    "openai-api-key",
    "anthropic-api-key",
    "openrouter-api-key",
    "mistral-api-key",
  ];

  for (const key of keysToMigrate) {
    try {
      const value = localStorage.getItem(key);
      if (value && value.trim().length > 0) {
        await setKey(key, value);
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to migrate ${key}:`, error);
      // Continue with other keys even if one fails
    }
  }

  // Mark migration as complete
  localStorage.setItem(MIGRATION_FLAG, "true");
}
