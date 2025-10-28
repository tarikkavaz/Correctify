import { invoke } from '@tauri-apps/api/core';
import { isTauri } from './utils';

/**
 * Secure storage wrapper for API keys using OS-level secure storage
 * - macOS: Keychain
 * - Windows: DPAPI
 * - Linux: System keyring
 * 
 * In web mode (non-Tauri), falls back to localStorage
 */

const KEY_PREFIX = 'correctify_';

/**
 * Get a key from secure storage (or localStorage in web mode)
 */
export async function getKey(key: string): Promise<string | null> {
  // In web mode, use localStorage as fallback
  if (!isTauri()) {
    return localStorage.getItem(key);
  }

  try {
    const value = await invoke<string>('plugin:secure-storage|get', {
      key: `${KEY_PREFIX}${key}`,
    });
    return value || null;
  } catch (error) {
    console.error(`Failed to get key "${key}" from secure storage:`, error);
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
    await invoke('plugin:secure-storage|set', {
      key: `${KEY_PREFIX}${key}`,
      value,
    });
  } catch (error) {
    console.error(`Failed to set key "${key}" in secure storage:`, error);
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
    await invoke('plugin:secure-storage|remove', {
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
  const MIGRATION_FLAG = 'MIGRATION_COMPLETE_V1_1_0';
  
  // Check if migration has already been completed
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') {
    console.log('Migration already completed, skipping...');
    return;
  }

  console.log('Starting migration from localStorage to secure storage...');

  const keysToMigrate = [
    'openai-api-key',
    'anthropic-api-key',
    'openrouter-api-key',
    'mistral-api-key',
  ];

  let migratedCount = 0;

  for (const key of keysToMigrate) {
    try {
      const value = localStorage.getItem(key);
      if (value && value.trim().length > 0) {
        console.log(`Migrating ${key}...`);
        await setKey(key, value);
        localStorage.removeItem(key);
        migratedCount++;
        console.log(`Successfully migrated ${key}`);
      }
    } catch (error) {
      console.error(`Failed to migrate ${key}:`, error);
      // Continue with other keys even if one fails
    }
  }

  // Mark migration as complete
  localStorage.setItem(MIGRATION_FLAG, 'true');
  console.log(`Migration complete. Migrated ${migratedCount} key(s).`);
}
