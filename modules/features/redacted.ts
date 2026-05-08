/// <reference types="chrome" />
/**
 * redacted.ts — Mode Redacted: mask sidebar conversation titles
 * 
 * When enabled: all conversation titles are covered by opaque black blocks.
 * On hover over the sidebar area: all blocks disappear instantly.
 * On mouse leave: blocks return.
 */

import { SIDEBAR_HOST, CONVERSATION_LINKS, gwuClass } from '../dom/selectors';
import { injectShadowStyle } from '../dom/shadow-utils';
import { getRedactedEnabled, onStorageChange } from '../storage/stats-store';

const REDACTED_STYLE_ID = 'gwu-redacted-style';

const REDACTED_CSS = `
  .gwu-redacted-text, .gwu-redacted-media {
    position: relative;
    display: inline-block;
  }

  .${gwuClass('redacted-active')} .gwu-redacted-text::after,
  .${gwuClass('redacted-active')} .gwu-redacted-media::after {
    content: '';
    position: absolute;
    inset: -1px -2px;
    background: #111;
    border-radius: 3px;
    z-index: 10;
    pointer-events: none;
    transform-origin: left center;
    transition: transform var(--gwu-speed, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .${gwuClass('redacted-active')} .gwu-redacted-media::after {
    inset: -2px;
    border-radius: 20px; /* Fully cover the rounded square images */
  }

  /* Reveal on hover anywhere in the sidebar */
  .${gwuClass('redacted-active')}:hover .gwu-redacted-text::after,
  .${gwuClass('redacted-active')}:hover .gwu-redacted-media::after {
    transform: scaleX(0);
  }
`;

let enabled = true;
let cleanupFn: (() => void) | null = null;

function findSidebar(): Element | null {
  const selectors = SIDEBAR_HOST.split(',').map(s => s.trim());
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function applyToLinks(container: HTMLElement) {
  // 1. Text links
  const links = container.querySelectorAll('a[href*="/app/"]');
  links.forEach(a => {
    if (a.hasAttribute('data-gwu-redacted')) return;
    a.setAttribute('data-gwu-redacted', 'true');
    
    const walk = document.createTreeWalker(a, NodeFilter.SHOW_TEXT, null);
    let maxLen = 0;
    let targetEl: HTMLElement | null = null;
    let n;
    while (n = walk.nextNode()) {
      const txt = n.textContent?.trim() || '';
      if (txt.length > maxLen) {
        maxLen = txt.length;
        if (n.parentElement) {
          targetEl = n.parentElement;
        }
      }
    }
    if (targetEl) {
      targetEl.classList.add('gwu-redacted-text');
      targetEl.style.setProperty('--gwu-speed', (0.3 + Math.random() * 0.5).toFixed(2) + 's');
    }
  });

  // 2. Images (Mes contenus / Gems)
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    const parent = img.parentElement;
    if (!parent || parent.hasAttribute('data-gwu-redacted')) return;
    parent.setAttribute('data-gwu-redacted', 'true');
    parent.classList.add('gwu-redacted-media');
    parent.style.setProperty('--gwu-speed', (0.3 + Math.random() * 0.5).toFixed(2) + 's');
  });
}

function applySidebarRedaction(sidebar: Element) {
  // Inject style into shadow root if exists, otherwise into head
  if (sidebar.shadowRoot) {
    injectShadowStyle(sidebar, REDACTED_CSS, REDACTED_STYLE_ID);
    if (enabled) {
      const container = sidebar.shadowRoot.querySelector('.sidenav-container, [class*="side"], :first-child') || sidebar.shadowRoot.children[0];
      if (container instanceof HTMLElement) {
        container.classList.add(gwuClass('redacted-active'));
        applyToLinks(container);
      }
    }
  } else {
    // No shadow DOM — inject to <head> and apply class to sidebar
    if (!document.getElementById(REDACTED_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = REDACTED_STYLE_ID;
      style.textContent = REDACTED_CSS;
      document.head.appendChild(style);
    }
    if (enabled) {
      sidebar.classList.add(gwuClass('redacted-active'));
      applyToLinks(sidebar as HTMLElement);
    }
  }
}

function removeSidebarRedaction(sidebar: Element) {
  if (sidebar.shadowRoot) {
    const container = sidebar.shadowRoot.children[0];
    if (container instanceof HTMLElement) {
      container.classList.remove(gwuClass('redacted-active'));
    }
  } else {
    sidebar.classList.remove(gwuClass('redacted-active'));
  }
}

function updateRedaction() {
  const sidebar = findSidebar();
  if (!sidebar) return;

  if (enabled) {
    applySidebarRedaction(sidebar);
  } else {
    removeSidebarRedaction(sidebar);
  }
}

export async function initRedacted(): Promise<() => void> {
  enabled = await getRedactedEnabled();

  // Initial application
  updateRedaction();

  // Observe for sidebar appearing (SPA)
  const observer = new MutationObserver(() => {
    updateRedaction();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for toggle changes from popup
  onStorageChange((changes) => {
    if (changes.redactedEnabled) {
      enabled = changes.redactedEnabled.newValue as boolean;
      updateRedaction();
    }
  });

  // Also listen for messages from background
  const messageHandler = (message: any) => {
    if (message.type === 'GWU_REDACTED_CHANGED') {
      enabled = message.enabled;
      updateRedaction();
    }
  };
  chrome.runtime.onMessage.addListener(messageHandler);

  cleanupFn = () => {
    observer.disconnect();
    chrome.runtime.onMessage.removeListener(messageHandler);
    const sidebar = findSidebar();
    if (sidebar) removeSidebarRedaction(sidebar);
  };

  return cleanupFn;
}
