import type { ExtensionMessage } from '@/types/messages';

/**
 * Send a message to the background service worker and await a response.
 */
export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a message to a specific tab's content script.
 */
export function sendToTab<T = unknown>(tabId: number, message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Register a message listener. Returns an unsubscribe function.
 */
export function onMessage(
  handler: (
    msg: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => void | boolean | Promise<unknown>
): () => void {
  const listener = (
    msg: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ): boolean | void => {
    const result = handler(msg, sender, sendResponse);
    if (result instanceof Promise) {
      result.then(sendResponse).catch(err => sendResponse({ error: err.message }));
      return true; // keep the message channel open
    }
    return result;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * Broadcast a message to all extension views (popup, options page).
 */
export async function broadcast(message: ExtensionMessage): Promise<void> {
  const views = chrome.extension.getViews?.() ?? [];
  for (const view of views) {
    try {
      view.chrome?.runtime?.sendMessage?.(message);
    } catch {
      // View may have closed
    }
  }
  // Also notify via runtime (picked up by any active popup/options)
  try {
    chrome.runtime.sendMessage(message);
  } catch {
    // No receivers
  }
}
