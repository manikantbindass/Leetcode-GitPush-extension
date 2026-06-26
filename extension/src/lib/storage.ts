import type { ExtensionStorage } from '@/types/storage';

/**
 * Get a single key from chrome.storage.local.
 */
export function get<K extends keyof ExtensionStorage>(key: K): Promise<ExtensionStorage[K]> {
  return new Promise(resolve => {
    chrome.storage.local.get(key as string, result => {
      resolve(result[key as string] as ExtensionStorage[K]);
    });
  });
}

/**
 * Get all stored data.
 */
export function getAll(): Promise<ExtensionStorage> {
  return new Promise(resolve => {
    chrome.storage.local.get(null, result => {
      resolve(result as ExtensionStorage);
    });
  });
}

/**
 * Set a single key in chrome.storage.local.
 */
export function set<K extends keyof ExtensionStorage>(
  key: K,
  value: ExtensionStorage[K]
): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Set multiple keys at once.
 */
export function setMany(data: Partial<ExtensionStorage>): Promise<void> {
  return new Promise(resolve => {
    // Filter out undefined values to avoid overwriting with undefined
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    chrome.storage.local.set(filtered, resolve);
  });
}

/**
 * Remove a key from storage.
 */
export function remove(key: keyof ExtensionStorage): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.remove(key as string, resolve);
  });
}

/**
 * Clear all extension storage.
 */
export function clear(): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.clear(resolve);
  });
}

/**
 * Subscribe to storage changes. Returns an unsubscribe function.
 */
export function onChange(callback: (changes: Partial<ExtensionStorage>) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string
  ) => {
    if (area !== 'local') return;
    const result: Partial<ExtensionStorage> = {};
    for (const [key, change] of Object.entries(changes)) {
      (result as Record<string, unknown>)[key] = change.newValue;
    }
    callback(result);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
