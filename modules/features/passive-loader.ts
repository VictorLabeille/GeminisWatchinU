/**
 * passive-loader.ts — Passive-aggressive loading messages
 * Shows sarcastic text under the loading animation while Gemini generates.
 */

import { gwuClass, MODEL_RESPONSE } from '../dom/selectors';

const LOADING_MESSAGES = [
  'Partage actif avec la NSA...',
  'Jugement de ton orthographe en cours...',
  'Calcul de ton empreinte carbone...',
  'Aspiration de tes données personnelles...',
  'Entraînement du modèle avec ta requête...',
  'Consultation du dossier CIA...',
  'Évaluation de ton QI en cours...',
  'Surveillance biométrique activée...',
  'Transmission au Mossad...',
  'Analyse de ta dépendance numérique...',
  'Facturation en CO2...',
  'Destruction d\'un glacier pour toi...',
];

let activeLoaders: Map<Element, HTMLElement> = new Map();

function getRandomMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

function createLoaderElement(): HTMLElement {
  const el = document.createElement('div');
  el.className = gwuClass('passive-loader');
  el.innerHTML = `
    <span class="${gwuClass('loader-text')}">${getRandomMessage()}</span>
  `;

  // Cycle messages
  const textEl = el.querySelector(`.${gwuClass('loader-text')}`) as HTMLElement;
  const interval = setInterval(() => {
    if (!el.isConnected) {
      clearInterval(interval);
      return;
    }
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = getRandomMessage();
      textEl.style.opacity = '1';
    }, 300);
  }, 3000);

  return el;
}

export function attachPassiveLoader(responseElement: Element): void {
  // Don't double-attach
  if (activeLoaders.has(responseElement)) return;

  const loader = createLoaderElement();

  // Insert after the response element
  responseElement.after(loader);
  activeLoaders.set(responseElement, loader);

  // Watch for the response to finish streaming
  const checkDone = () => {
    // Check if the response has finished (no more streaming indicators)
    const isStillLoading = responseElement.querySelector('[class*="loading"]') ||
      responseElement.getAttribute('aria-busy') === 'true' ||
      responseElement.querySelector('[class*="streaming"]');

    if (!isStillLoading) {
      // Also check if content has been added (response complete)
      const hasContent = responseElement.shadowRoot
        ? responseElement.shadowRoot.textContent && responseElement.shadowRoot.textContent.length > 10
        : responseElement.textContent && responseElement.textContent.length > 10;

      if (hasContent) {
        removeLoader(responseElement);
        return;
      }
    }
  };

  // Use MutationObserver on the response element
  const obs = new MutationObserver(() => {
    checkDone();
  });

  // Observe the element and its shadow root
  obs.observe(responseElement, { childList: true, subtree: true, attributes: true });
  if (responseElement.shadowRoot) {
    obs.observe(responseElement.shadowRoot, { childList: true, subtree: true });
  }

  // Also poll as fallback (some changes might not trigger mutations)
  const pollId = setInterval(() => {
    if (!responseElement.isConnected) {
      clearInterval(pollId);
      removeLoader(responseElement);
      return;
    }
    checkDone();
  }, 2000);

  // Safety: remove after 60s max
  setTimeout(() => {
    clearInterval(pollId);
    obs.disconnect();
    removeLoader(responseElement);
  }, 60000);
}

function removeLoader(responseElement: Element): void {
  const loader = activeLoaders.get(responseElement);
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
    activeLoaders.delete(responseElement);
  }
}

export function initPassiveLoader(): () => void {
  // Cleanup function
  return () => {
    activeLoaders.forEach((loader) => loader.remove());
    activeLoaders.clear();
  };
}
