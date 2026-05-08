/**
 * background.ts — Service Worker
 * 
 * Handles:
 * - SPA navigation detection via webNavigation API
 * - Message relay between popup ↔ content script
 */

export default defineBackground(() => {
  // ── SPA Navigation Listener ──────────────────────────────
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url.includes('gemini.google.com')) {
      chrome.tabs.sendMessage(details.tabId, {
        type: 'GWU_NAVIGATION',
        url: details.url,
      }).catch(() => {
        // Content script might not be ready yet, ignore
      });
    }
  });

  // ── Message Handler ──────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GWU_GET_REDACTED') {
      chrome.storage.local.get('redactedEnabled').then((result) => {
        sendResponse({ enabled: result.redactedEnabled ?? true });
      });
      return true; // async
    }

    if (message.type === 'GWU_SET_REDACTED') {
      chrome.storage.local.set({ redactedEnabled: message.enabled }).then(() => {
        // Relay to all Gemini tabs
        chrome.tabs.query({ url: 'https://gemini.google.com/*' }, (tabs) => {
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'GWU_REDACTED_CHANGED',
                enabled: message.enabled,
              }).catch(() => {});
            }
          }
        });
        sendResponse({ ok: true });
      });
      return true; // async
    }

    if (message.type === 'GWU_RELOAD_TABS') {
      chrome.tabs.query({ url: 'https://gemini.google.com/*' }, (tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.reload(tab.id).catch(() => {});
          }
        }
      });
      sendResponse({ ok: true });
      return false; // sync response
    }
  });

  console.log('[GWU] Background service worker initialized');
});
