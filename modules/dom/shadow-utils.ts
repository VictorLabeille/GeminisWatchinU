/**
 * shadow-utils.ts — Helpers for traversing Shadow DOM boundaries
 */

/**
 * Query an element inside a shadow root of a host element.
 */
export function queryShadow<T extends Element = Element>(
  hostSelector: string,
  innerSelector: string,
  root: Document | ShadowRoot = document
): T | null {
  const host = root.querySelector(hostSelector);
  if (!host?.shadowRoot) return null;
  return host.shadowRoot.querySelector<T>(innerSelector);
}

/**
 * Query all elements inside a shadow root of a host element.
 */
export function queryShadowAll<T extends Element = Element>(
  hostSelector: string,
  innerSelector: string,
  root: Document | ShadowRoot = document
): T[] {
  const host = root.querySelector(hostSelector);
  if (!host?.shadowRoot) return [];
  return Array.from(host.shadowRoot.querySelectorAll<T>(innerSelector));
}

/**
 * Deep query: traverse multiple shadow boundaries.
 * Path is an array of selectors, each one selecting inside the previous shadow root.
 * Example: deepQueryShadow(['bard-sidenav', 'conversation-list', 'a.item'])
 */
export function deepQueryShadow<T extends Element = Element>(
  path: string[]
): T | null {
  let current: Document | ShadowRoot | Element = document;

  for (let i = 0; i < path.length; i++) {
    const isLast = i === path.length - 1;
    const selector = path[i];

    if (current instanceof Document || current instanceof ShadowRoot) {
      const el = current.querySelector(selector);
      if (!el) return null;
      if (isLast) return el as T;
      if (el.shadowRoot) {
        current = el.shadowRoot;
      } else {
        current = el;
      }
    } else {
      // Element without shadow root, try querySelector on it
      const el = current.querySelector(selector);
      if (!el) return null;
      if (isLast) return el as T;
      if (el.shadowRoot) {
        current = el.shadowRoot;
      } else {
        current = el;
      }
    }
  }

  return null;
}

/**
 * Wait for an element to appear (in light or shadow DOM), then resolve.
 * Uses MutationObserver with timeout.
 */
export function waitForElement<T extends Element = Element>(
  selector: string,
  root: Document | ShadowRoot = document,
  timeoutMs = 10000
): Promise<T | null> {
  return new Promise((resolve) => {
    const existing = root.querySelector<T>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = root.querySelector<T>(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(root instanceof Document ? root.body : root, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

/**
 * Observe a shadow host: when it appears, attach observer to its shadow root.
 * Returns a cleanup function.
 */
export function observeShadowHost(
  hostSelector: string,
  callback: MutationCallback,
  config: MutationObserverInit = { childList: true, subtree: true }
): (() => void) {
  let innerObserver: MutationObserver | null = null;

  function tryAttach() {
    const host = document.querySelector(hostSelector);
    if (host?.shadowRoot && !innerObserver) {
      innerObserver = new MutationObserver(callback);
      innerObserver.observe(host.shadowRoot, config);
    }
  }

  // Try immediately
  tryAttach();

  // Also observe document for the host appearing
  const outerObserver = new MutationObserver(() => {
    tryAttach();
  });

  outerObserver.observe(document.body, { childList: true, subtree: true });

  return () => {
    outerObserver.disconnect();
    innerObserver?.disconnect();
  };
}

/**
 * Inject a <style> element into a shadow root.
 */
export function injectShadowStyle(host: Element, css: string, id?: string): HTMLStyleElement | null {
  if (!host.shadowRoot) return null;
  
  // Avoid duplicates
  if (id) {
    const existing = host.shadowRoot.querySelector(`style#${id}`);
    if (existing) return existing as HTMLStyleElement;
  }

  const style = document.createElement('style');
  if (id) style.id = id;
  style.textContent = css;
  host.shadowRoot.appendChild(style);
  return style;
}
