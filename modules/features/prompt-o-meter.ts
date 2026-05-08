/**
 * prompt-o-meter.ts — Judges the user's AI dependency level
 * Displayed on home page only, updates in real-time.
 */

import { gwuClass, isHomePage, findInputAreaAnchor, findMainContentArea, findAccountIconAnchor } from '../dom/selectors';
import { getTodayCount } from '../storage/stats-store';
import { registerWidget, unregisterWidget } from '../dom/overlay';

let meterElement: HTMLElement | null = null;

const METER_ID = gwuClass('prompt-o-meter');

interface Level {
  min: number;
  max: number;
  label: string;
  emoji: string;
  color: string;
}

const LEVELS: Level[] = [
  { min: 0,  max: 0,  label: 'Bébé Cadum',            emoji: '👶', color: '#86efac' },
  { min: 1,  max: 3,  label: 'Penseur indépendant',    emoji: '🧠', color: '#67e8f9' },
  { min: 4,  max: 5,  label: 'Penseur pas trop libre',  emoji: '🤔', color: '#fbbf24' },
  { min: 6,  max: 10, label: 'Prompt hein-génieur',     emoji: '⚙️', color: '#fb923c' },
  { min: 11, max: 15, label: 'Good Boy',                emoji: '🐕', color: '#f87171' },
  { min: 16, max: 25, label: 'ClankerLover',            emoji: '🤖', color: '#e879f9' },
  { min: 26, max: 35, label: 'Gooning Bot',             emoji: '💀', color: '#c084fc' },
  { min: 36, max: 49, label: 'Soldat du Tsahal',        emoji: '🪖', color: '#ef4444' },
];

function getLevel(count: number): { label: string; emoji: string; color: string } {
  if (count >= 50) {
    return {
      label: `${count} prompts en un seul jour ??? Tu t'es cru dans WALL-E fils de pute ?`,
      emoji: '🗑️',
      color: '#dc2626',
    };
  }
  const level = LEVELS.find(l => count >= l.min && count <= l.max);
  return level || LEVELS[0];
}

function buildMeterHTML(count: number): string {
  const level = getLevel(count);
  return `
    <div id="${METER_ID}" class="${gwuClass('meter')}">
      <div class="${gwuClass('meter-header')}">
        <span class="${gwuClass('meter-icon')}">${level.emoji}</span>
        <span class="${gwuClass('meter-title')}">Prompt-O-Meter</span>
      </div>
      <div class="${gwuClass('meter-level')}" style="color: ${level.color}">
        ${level.label}
      </div>
      <div class="${gwuClass('meter-count')}">
        ${count} requête${count !== 1 ? 's' : ''} aujourd'hui
      </div>
      <div class="${gwuClass('meter-bar-bg')}">
        <div class="${gwuClass('meter-bar-fill')}" style="
          width: ${Math.min((count / 50) * 100, 100)}%;
          background: ${level.color};
        "></div>
      </div>
    </div>
  `;
}

export async function showPromptOMeter(): Promise<void> {
  if (!isHomePage()) return;
  removePromptOMeter();

  const count = await getTodayCount();
  const container = document.createElement('div');
  container.id = gwuClass('meter-outer');
  // Add absolute positioning for overlay
  container.style.position = 'absolute';
  container.innerHTML = buildMeterHTML(count);

  meterElement = container;

  registerWidget({
    id: 'prompt-o-meter',
    element: container,
    updatePosition: () => {
      if (!meterElement) return;
      // Position Meter at the top right, under the account icon
      const accountIcon = findAccountIconAnchor();
      if (accountIcon) {
        const rect = accountIcon.getBoundingClientRect();
        meterElement!.style.top = `${rect.bottom + window.scrollY + 10}px`;
        // Align right edge of meter with right edge of the icon (with some padding)
        meterElement!.style.left = `${rect.right + window.scrollX - meterElement!.offsetWidth}px`;
      } else {
        // Fallback: top right of window
        meterElement!.style.top = `60px`;
        meterElement!.style.left = `${window.innerWidth - meterElement!.offsetWidth - 20}px`;
      }
    }
  });
}

export function removePromptOMeter(): void {
  unregisterWidget('prompt-o-meter');
  meterElement = null;
}

export async function updatePromptOMeter(): Promise<void> {
  if (isHomePage()) {
    removePromptOMeter();
    await showPromptOMeter();
  }
}

export function handleMeterNavigation(isHome: boolean): void {
  if (isHome) showPromptOMeter(); else removePromptOMeter();
}
