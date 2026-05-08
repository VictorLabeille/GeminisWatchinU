/**
 * ecocide-achievement.ts — Steam-like achievement notification at 40 daily requests
 */

import { gwuClass } from '../dom/selectors';
import { getTodayCount } from '../storage/stats-store';

const ACHIEVEMENT_ID = gwuClass('achievement');

const ECO_MESSAGES = [
  { title: '🌲 Achievement Unlocked', text: 'Une nouvelle forêt de brûlée' },
  { title: '🏗️ Achievement Unlocked', text: 'Nouveau village rasé pour construction d\'un data center' },
  { title: '🧊 Achievement Unlocked', text: 'Un glacier de plus fondu pour ta requête' },
  { title: '🔥 Achievement Unlocked', text: 'Record d\'émissions CO2 battu — GG' },
  { title: '⚡ Achievement Unlocked', text: 'Tu consommes plus qu\'un petit pays africain' },
  { title: '🌍 Achievement Unlocked', text: '+0.001°C de réchauffement climatique grâce à toi' },
];

let triggered = false;

function getRandomMessage() {
  return ECO_MESSAGES[Math.floor(Math.random() * ECO_MESSAGES.length)];
}

function showAchievement() {
  // Remove any existing
  document.getElementById(ACHIEVEMENT_ID)?.remove();

  const msg = getRandomMessage();

  const el = document.createElement('div');
  el.id = ACHIEVEMENT_ID;
  el.className = gwuClass('achievement');
  el.innerHTML = `
    <div class="${gwuClass('achievement-inner')}">
      <div class="${gwuClass('achievement-header')}">
        <span class="${gwuClass('achievement-icon')}">🏆</span>
        <span class="${gwuClass('achievement-title')}">${msg.title}</span>
      </div>
      <div class="${gwuClass('achievement-subtitle')}">ÉCOCIDE</div>
      <div class="${gwuClass('achievement-text')}">${msg.text}</div>
    </div>
  `;

  document.body.appendChild(el);

  // Auto-remove after animations complete (6s total)
  setTimeout(() => {
    el.remove();
  }, 6500);
}

export async function checkEcocideAchievement(): Promise<void> {
  if (triggered) return;

  const count = await getTodayCount();
  if (count >= 40) {
    triggered = true;
    showAchievement();
  }
}

export function resetEcocideForNewDay(): void {
  triggered = false;
}

export function initEcocide(): () => void {
  // Reset at midnight
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

  const midnightTimeout = setTimeout(() => {
    resetEcocideForNewDay();
  }, msUntilMidnight);

  return () => {
    clearTimeout(midnightTimeout);
    document.getElementById(ACHIEVEMENT_ID)?.remove();
  };
}
