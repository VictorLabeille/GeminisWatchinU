/**
 * anti-short-prompt.ts — Block short prompts (<15 chars) on first attempt
 * Shows a shake animation and sarcastic message. Second attempt goes through.
 */

import { INPUT_AREA_HOST, SEND_BUTTON, RICH_TEXTAREA, gwuClass } from '../dom/selectors';

let blocked = false;
let lastBlockedText = '';
let observer: MutationObserver | null = null;
let cleanups: (() => void)[] = [];

const BLOCK_MSG = 'Allez mon grand tu peux brûler plus de tokens que ça';
const MIN_LENGTH = 15;

function findSendButton(): HTMLElement | null {
  const hostSels = INPUT_AREA_HOST.split(',').map(s => s.trim());
  for (const sel of hostSels) {
    const host = document.querySelector(sel);
    if (host?.shadowRoot) {
      const btn = host.shadowRoot.querySelector(SEND_BUTTON) as HTMLElement;
      if (btn) return btn;
    }
  }
  return document.querySelector(SEND_BUTTON) as HTMLElement;
}

function findEditor(): HTMLElement | null {
  const hostSels = INPUT_AREA_HOST.split(',').map(s => s.trim());
  for (const sel of hostSels) {
    const host = document.querySelector(sel);
    if (host?.shadowRoot) {
      const sels = RICH_TEXTAREA.split(',').map(s => s.trim());
      for (const s of sels) {
        const el = host.shadowRoot.querySelector(s) as HTMLElement;
        if (el) return el;
      }
    }
  }
  const sels = RICH_TEXTAREA.split(',').map(s => s.trim());
  for (const s of sels) {
    const el = document.querySelector(s) as HTMLElement;
    if (el) return el;
  }
  return null;
}

function getEditorText(): string {
  const editor = findEditor();
  if (!editor) return '';
  return (editor.textContent || '').trim();
}

function showBlockMessage(editor: HTMLElement) {
  // Add shake animation
  const wrapper = editor.closest('[class*="input"]') || editor.parentElement || editor;
  (wrapper as HTMLElement).classList.add(gwuClass('shake'));

  // Show warning message
  let msgEl = document.getElementById(gwuClass('short-prompt-msg'));
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.id = gwuClass('short-prompt-msg');
    msgEl.className = gwuClass('short-prompt-warning');
    msgEl.textContent = BLOCK_MSG;
    (wrapper as HTMLElement).parentElement?.appendChild(msgEl);
  }
  msgEl.style.display = 'block';
  msgEl.style.opacity = '1';

  // Remove shake after animation
  setTimeout(() => {
    (wrapper as HTMLElement).classList.remove(gwuClass('shake'));
  }, 400);

  // Fade out message after 3s
  setTimeout(() => {
    if (msgEl) {
      msgEl.style.opacity = '0';
      setTimeout(() => { if (msgEl) msgEl.style.display = 'none'; }, 300);
    }
  }, 3000);
}

function interceptSend(e: Event) {
  const text = getEditorText();

  if (text.length < MIN_LENGTH && text.length > 0) {
    if (!blocked || lastBlockedText !== text) {
      // First attempt: block
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      blocked = true;
      lastBlockedText = text;

      const editor = findEditor();
      if (editor) showBlockMessage(editor);
      return false;
    }
    // Second attempt with same text: allow through
    blocked = false;
    lastBlockedText = '';
  } else {
    blocked = false;
    lastBlockedText = '';
  }
}

function attachToSendButton() {
  const btn = findSendButton();
  if (!btn) return;
  if ((btn as any).__gwu_intercepted) return;

  btn.addEventListener('click', interceptSend, { capture: true });
  (btn as any).__gwu_intercepted = true;

  cleanups.push(() => {
    btn.removeEventListener('click', interceptSend, { capture: true });
    delete (btn as any).__gwu_intercepted;
  });
}

// Also intercept Enter key on the editor
function attachToEditor() {
  const editor = findEditor();
  if (!editor) return;
  if ((editor as any).__gwu_key_intercepted) return;

  const keyHandler = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Enter' && !ke.shiftKey) {
      const text = getEditorText();
      if (text.length < MIN_LENGTH && text.length > 0) {
        if (!blocked || lastBlockedText !== text) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          blocked = true;
          lastBlockedText = text;
          showBlockMessage(editor);
          return false;
        }
        blocked = false;
        lastBlockedText = '';
      }
    }
  };

  editor.addEventListener('keydown', keyHandler, { capture: true });
  (editor as any).__gwu_key_intercepted = true;

  cleanups.push(() => {
    editor.removeEventListener('keydown', keyHandler, { capture: true });
    delete (editor as any).__gwu_key_intercepted;
  });
}

export function initAntiShortPrompt(): () => void {
  attachToSendButton();
  attachToEditor();

  // Re-attach on DOM changes (SPA navigation)
  observer = new MutationObserver(() => {
    attachToSendButton();
    attachToEditor();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer?.disconnect();
    cleanups.forEach(fn => fn());
    cleanups = [];
  };
}
