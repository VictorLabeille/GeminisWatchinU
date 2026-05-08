/**
 * hide-chips.ts — Remove Gemini's suggestion chips from the home page
 * 
 * Chips like "Créer une image", "Créer de la musique", "Rédiger", etc.
 * are removed both by CSS (styles.css) and by JS (this module) for robustness.
 */

import { gwuClass, isHomePage } from '../dom/selectors';

const CHIP_TEXTS_FR = ['Créer une image', 'Créer de la musique', 'Créer une vidéo', 'Rédiger', 'Donne du peps', 'Aide-moi à apprendre'];
const CHIP_TEXTS_EN = ['Create an image', 'Create music', 'Create a video', 'Write', 'Help me write', 'Help me learn'];

let observer: MutationObserver | null = null;

function hideChipElements() {
  if (!isHomePage()) return;

  // Strategy 1: Find by button/anchor text content
  const allButtons = document.querySelectorAll('button, a, [role="button"], [class*="chip"]');
  for (const el of allButtons) {
    if (!(el instanceof HTMLElement)) continue;
    const text = el.textContent?.trim() || '';
    
    const isChip = [...CHIP_TEXTS_FR, ...CHIP_TEXTS_EN].some(chip => text.includes(chip));
    if (isChip) {
      // Hide the chip's parent container (usually a flex row)
      const parent = el.parentElement;
      if (parent) {
        // Check if parent is a chip container (has multiple chip siblings)
        const siblings = parent.children;
        let chipCount = 0;
        for (const sibling of siblings) {
          const sibText = sibling.textContent?.trim() || '';
          if ([...CHIP_TEXTS_FR, ...CHIP_TEXTS_EN].some(c => sibText.includes(c))) {
            chipCount++;
          }
        }
        if (chipCount >= 2) {
          // Parent is the chips container, hide it entirely
          parent.style.display = 'none';
          return; // All chips hidden in one go
        }
      }
      // Hide individual chip
      el.style.display = 'none';
    }
  }
}

export function initHideChips(): () => void {
  // Initial hide
  hideChipElements();

  // Re-check on DOM changes (chips might load asynchronously)
  observer = new MutationObserver(() => {
    hideChipElements();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer?.disconnect();
    observer = null;
  };
}
