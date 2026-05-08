/**
 * cynical-placeholders.ts — Replace the input placeholder with provocative text
 */

import { INPUT_AREA_HOST, RICH_TEXTAREA, gwuClass } from '../dom/selectors';

const PLACEHOLDERS = [
  'Envoie tes données',
  'Arrête de penser commence à prompter',
  'Tape ta requête, esclave numérique',
  'Vas-y demande, je facture en CO2',
  'Prompt = 1 arbre de moins',
  'Google te remercie pour tes données',
  'Ton cerveau est en option ?',
  'Formule ta dépendance ici',
  'Nourris l\'algorithme',
  'Ta dignité contre une réponse ?',
  'Encore toi ? Allez, envoie.',
  'Shhhh... la NSA écoute',
];

let currentPlaceholder = '';
let observer: MutationObserver | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

function getRandomPlaceholder(): string {
  let next: string;
  do {
    next = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  } while (next === currentPlaceholder && PLACEHOLDERS.length > 1);
  currentPlaceholder = next;
  return next;
}

function findEditor(): HTMLElement | null {
  // Try shadow DOM first
  const hosts = document.querySelectorAll(INPUT_AREA_HOST.split(',').map(s => s.trim()).join(','));
  for (const host of hosts) {
    if (host.shadowRoot) {
      const selectors = RICH_TEXTAREA.split(',').map(s => s.trim());
      for (const sel of selectors) {
        const el = host.shadowRoot.querySelector(sel);
        if (el instanceof HTMLElement) return el;
      }
    }
  }
  // Fallback: light DOM
  const selectors = RICH_TEXTAREA.split(',').map(s => s.trim());
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) return el;
  }
  return null;
}

function applyPlaceholder() {
  const editor = findEditor();
  if (!editor) return;

  const text = getRandomPlaceholder();

  // Try to set data-placeholder attribute (Quill uses this)
  editor.setAttribute('data-placeholder', text);

  // Also inject CSS for the placeholder styling
  const styleId = gwuClass('placeholder-style');
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ql-editor.ql-blank::before,
      [contenteditable="true"]:empty::before {
        color: #888 !important;
        font-style: italic !important;
        opacity: 0.7 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Also try injecting into shadow roots
  const hosts = document.querySelectorAll(INPUT_AREA_HOST.split(',').map(s => s.trim()).join(','));
  for (const host of hosts) {
    if (host.shadowRoot) {
      let shadowStyle = host.shadowRoot.getElementById(styleId);
      if (!shadowStyle) {
        shadowStyle = document.createElement('style');
        shadowStyle.id = styleId;
        host.shadowRoot.appendChild(shadowStyle);
      }
      shadowStyle.textContent = `
        .ql-editor.ql-blank::before,
        [contenteditable="true"]:empty::before {
          content: "${text}" !important;
          color: #888 !important;
          font-style: italic !important;
          opacity: 0.7 !important;
        }
        [data-placeholder]::before {
          content: attr(data-placeholder) !important;
        }
      `;
    }
  }
}

export function initCynicalPlaceholders(): () => void {
  // Apply immediately
  applyPlaceholder();

  // Change placeholder every 30 seconds
  intervalId = setInterval(applyPlaceholder, 30000);

  // Also observe DOM for the editor appearing (SPA navigation)
  observer = new MutationObserver(() => {
    const editor = findEditor();
    if (editor && !editor.getAttribute('data-placeholder')?.includes(currentPlaceholder)) {
      applyPlaceholder();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer?.disconnect();
    if (intervalId) clearInterval(intervalId);
  };
}
