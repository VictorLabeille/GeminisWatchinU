/**
 * selectors.ts — Centralized DOM selectors for Gemini (FR + EN)
 * 
 * These target Custom Element tag names (most stable) with ARIA fallbacks.
 * All selectors support both French and English Gemini interfaces.
 */

// ─── Sidebar / Navigation ────────────────────────────────────────
export const SIDEBAR_HOST = 'bard-sidenav, [role="navigation"], [role="complementary"]';

// Inside sidebar shadow root
export const CONVERSATION_LINKS = 'a[href*="/app/"]';
export const CONVERSATION_TITLE = 'span, .conversation-title, [class*="title"]';

// ─── Chat Input ──────────────────────────────────────────────────
export const INPUT_AREA_HOST = 'input-area-v2, [class*="input-area"]';
export const RICH_TEXTAREA = 'rich-textarea, .ql-editor, [contenteditable="true"], [role="textbox"]';
export const INPUT_PLACEHOLDER_EMPTY = '.ql-editor.ql-blank, [contenteditable="true"]:empty';

// ─── Send Button (FR + EN) ──────────────────────────────────────
export const SEND_BUTTON = [
  'button[aria-label*="Send"]',
  'button[aria-label*="Envoyer"]',
  'button[data-tooltip*="Send"]',
  'button[data-tooltip*="Envoyer"]',
].join(', ');

// ─── Messages ────────────────────────────────────────────────────
export const USER_QUERY = 'user-query';
export const MODEL_RESPONSE = 'model-response';
export const RESPONSE_CONTAINER = 'response-container';
export const CHAT_WINDOW = 'chat-window';

// ─── Home Page ───────────────────────────────────────────────────
export const GREETING = '[class*="greeting"], [class*="welcome"], [class*="hero"], [class*="landing"]';
export const SUGGESTION_CHIPS = 'suggestion-chip, [class*="chip"], [class*="suggestion"]';

// ─── Loading Indicators ─────────────────────────────────────────
export const LOADING_INDICATOR = 'loading-indicator, [class*="loading"], [aria-busy="true"]';

// ─── URL Patterns ────────────────────────────────────────────────
export function isHomePage(): boolean {
  const path = window.location.pathname;
  return path === '/app' || path === '/app/' || path === '/';
}

export function isConversationPage(): boolean {
  return /^\/app\/[a-zA-Z0-9]+/.test(window.location.pathname);
}

// ─── Prefixed class names for our extension (avoid collisions) ──
export const PREFIX = 'gwu';
export function gwuClass(name: string): string {
  return `${PREFIX}-${name}`;
}

// ─── Layout Anchors ─────────────────────────────────────────────
// Used to position GWU widgets relative to Gemini's content.
// Layout order: [YEUX] → [GREETING] → [INPUT natif] → [HISTOGRAMME] → [PROMPT-O-METER]

/**
 * Find the greeting container ("Bonjour Victor" / "Par où commencer").
 * Eyes are injected relative to this element.
 */
export function findGreetingAnchor(): HTMLElement | null {
  // Strategy 1: Class-based selectors (may work depending on Gemini version)
  const byClass = document.querySelector('[class*="greeting"], [class*="welcome"], [class*="hero"], [class*="landing"]') as HTMLElement;
  if (byClass) return byClass;

  // Strategy 2: Find heading containing greeting text (FR + EN)
  const greetingPatterns = ['Bonjour', 'Hello', 'Par où commencer', 'How can I help', 'What can I help'];
  const headings = document.querySelectorAll('h1, h2, h3, p, span, div');
  
  for (const el of headings) {
    if (!(el instanceof HTMLElement)) continue;
    const text = el.textContent?.trim() || '';
    
    for (const pattern of greetingPatterns) {
      if (text.includes(pattern)) {
        // Return the exact element for precise bounding-box calculations
        return el;
      }
    }
  }

  return null;
}

/**
 * Find the input area container (the outermost wrapper around the prompt input).
 * This is the anchor point: eyes go BEFORE it, dashboard/meter go AFTER it.
 */
export function findInputAreaAnchor(): HTMLElement | null {
  // Strategy 1: Try custom element tags (these are the most stable bounding boxes for the whole input bar)
  const inputArea = document.querySelector('input-area-v2, input-area, .input-area') as HTMLElement;
  if (inputArea) return inputArea;

  // Strategy 2: Find the ql-editor (Quill) or textbox
  const qlEditor = document.querySelector('.ql-editor, [role="textbox"], [contenteditable="true"]') as HTMLElement;
  if (qlEditor) {
    // Return the closest fieldset/form or just the editor itself
    const formContainer = qlEditor.closest('fieldset, form') as HTMLElement;
    return formContainer || qlEditor;
  }

  console.warn('[GWU] Could not find input area anchor');
  return null;
}

/**
 * Find the account profile icon at the top right.
 */
export function findAccountIconAnchor(): HTMLElement | null {
  const avatar = document.querySelector('a[aria-label*="Google"] img, a[aria-label*="Compte Google"] img, img.gb_Aa, img.gb_n, img[src*="googleusercontent"]') as HTMLElement;
  if (avatar) return avatar;
  
  const header = document.querySelector('header') as HTMLElement;
  if (header) {
    return (header.lastElementChild as HTMLElement) || header;
  }
  return null;
}

/**
 * Find the main content area (right side of the page, excluding sidebar).
 */
export function findMainContentArea(): HTMLElement | null {
  const main = document.querySelector('main, [role="main"]') as HTMLElement;
  if (main) return main;

  // Fallback: find the largest non-sidebar container
  const candidates = document.querySelectorAll('[class*="content"], [class*="main"], [class*="chat"]');
  for (const el of candidates) {
    if (el instanceof HTMLElement && el.offsetWidth > 400) return el;
  }

  return document.body;
}
