import { invoke } from "@tauri-apps/api/core";
import type { Provider } from "./types";
import { isTauri } from "./utils";

/**
 * Secure storage wrapper for API keys using OS-level secure storage
 * - macOS: Keychain
 * - Windows: DPAPI
 * - Linux: System keyring
 *
 * Correctify is desktop-only. Browser builds never retain API credentials.
 */

const KEY_PREFIX = "correctify_";
const KEYRING_RECORD = `${KEY_PREFIX}api-keys-v2`;
const EMPTY_KEYS: Record<Provider, string> = { openai: "", anthropic: "", mistral: "", openrouter: "" };
let keysPromise: Promise<Record<Provider, string>> | null = null;

function providerFromKey(key: string): Provider | null {
  const provider = key.replace(/-api-key$/, "");
  return provider in EMPTY_KEYS ? provider as Provider : null;
}

async function loadKeys(): Promise<Record<Provider, string>> {
  if (!isTauri()) return { ...EMPTY_KEYS };
  try {
    const value = await invoke<string>("secure_storage_get", { key: KEYRING_RECORD });
    return { ...EMPTY_KEYS, ...JSON.parse(value) };
  } catch {
    return { ...EMPTY_KEYS };
  }
}

export function getKeys(): Promise<Record<Provider, string>> {
  keysPromise ??= loadKeys();
  return keysPromise;
}

async function saveKeys(keys: Record<Provider, string>): Promise<void> {
  await invoke("secure_storage_set", { key: KEYRING_RECORD, value: JSON.stringify(keys) });
  keysPromise = Promise.resolve(keys);
}

/**
 * Get a key from secure storage (or localStorage in web mode)
 */
export async function getKey(key: string): Promise<string | null> {
  const provider = providerFromKey(key);
  if (!provider) return null;
  return (await getKeys())[provider] || null;
}

/**
 * Set a key in secure storage (or localStorage in web mode)
 */
export async function setKey(key: string, value: string): Promise<void> {
  if (!isTauri()) throw new Error("API keys are available only in the Correctify desktop app");

  try {
    const provider = providerFromKey(key);
    if (!provider) throw new Error("Unknown API key provider");
    await saveKeys({ ...(await getKeys()), [provider]: value });
  } catch (error) {
    console.error(`Failed to save ${key} to secure storage:`, error);
    throw new Error(`Failed to save ${key} to secure storage`);
  }
}

/**
 * Delete a key from secure storage (or localStorage in web mode)
 */
export async function deleteKey(key: string): Promise<void> {
  if (!isTauri()) return;

  try {
    const provider = providerFromKey(key);
    if (!provider) return;
    await saveKeys({ ...(await getKeys()), [provider]: "" });
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

  if (!isTauri()) return;
  await invoke("migrate_legacy_key_files");
  await invoke("migrate_legacy_keyring_entries", { key: KEYRING_RECORD });
  keysPromise = null;

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

  await Promise.all(keysToMigrate.map(async (key) => {
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
  }));

  // Mark migration as complete
  localStorage.setItem(MIGRATION_FLAG, "true");
}
