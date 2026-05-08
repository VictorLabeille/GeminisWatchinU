/**
 * observer.ts — Central MutationObserver + SPA navigation detection
 */

import { USER_QUERY, MODEL_RESPONSE, isHomePage } from './selectors';

export type NavigationHandler = (isHome: boolean, url: string) => void;
export type UserQueryHandler = (queryElement: Element) => void;
export type ModelResponseHandler = (responseElement: Element) => void;
export type GenericHandler = (node: Element) => void;

interface ObserverCallbacks {
  onNavigation?: NavigationHandler;
  onUserQuery?: UserQueryHandler;
  onModelResponse?: ModelResponseHandler;
  onDomReady?: GenericHandler;
}

let currentPath = window.location.pathname;
let mainObserver: MutationObserver | null = null;

/**
 * Initialize the central MutationObserver.
 * Detects: navigation changes, new user queries, new model responses.
 */
export function initCentralObserver(callbacks: ObserverCallbacks): () => void {
  // ── SPA Navigation Detection ──────────────────────────────
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function checkNavigation() {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      currentPath = newPath;
      callbacks.onNavigation?.(isHomePage(), window.location.href);
    }
  }

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    originalPushState(...args);
    checkNavigation();
  };

  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    originalReplaceState(...args);
    checkNavigation();
  };

  window.addEventListener('popstate', checkNavigation);

  // ── DOM Mutation Observer ──────────────────────────────────
  mainObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        const tagName = node.tagName.toUpperCase();

        // Detect new user query
        if (tagName === USER_QUERY.toUpperCase()) {
          callbacks.onUserQuery?.(node);
        }

        // Detect new model response (loading starts)
        if (tagName === MODEL_RESPONSE.toUpperCase()) {
          callbacks.onModelResponse?.(node);
        }

        // Also check children for the elements (they might be nested)
        const userQueries = node.querySelectorAll(USER_QUERY);
        userQueries.forEach((q) => callbacks.onUserQuery?.(q));

        const modelResponses = node.querySelectorAll(MODEL_RESPONSE);
        modelResponses.forEach((r) => callbacks.onModelResponse?.(r));

        // General DOM ready callback
        callbacks.onDomReady?.(node);
      }
    }
  });

  mainObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fire initial navigation
  callbacks.onNavigation?.(isHomePage(), window.location.href);

  // Return cleanup
  return () => {
    mainObserver?.disconnect();
    mainObserver = null;
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener('popstate', checkNavigation);
  };
}
