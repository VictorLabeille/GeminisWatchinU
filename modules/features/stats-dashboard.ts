/**
 * stats-dashboard.ts — Histogramme d'activité + stat bullshit + bouton "Effacer les preuves"
 * 
 * Displayed on home page only. Disappears in conversations.
 */

import { gwuClass, isHomePage, findInputAreaAnchor, findMainContentArea } from '../dom/selectors';
import { getLastNDays, getCurrentWeekStats, getWeeklyDelta, getBullshitStat, fakeClearStats, getTodayCount } from '../storage/stats-store';

const DASHBOARD_ID = gwuClass('dashboard');
let dashboardElement: HTMLElement | null = null;

async function buildDashboardHTML(): Promise<string> {
  const last7Days = await getCurrentWeekStats();
  const weeklyDelta = await getWeeklyDelta();
  const bullshit = await getBullshitStat();
  const maxCount = Math.max(...last7Days.map(d => d.count), 1);

  const barsHTML = last7Days.map((day, i) => {
    const heightPercent = (day.count / maxCount) * 100;
    const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' });
    return `
      <div class="${gwuClass('bar-wrapper')}" style="animation-delay: ${i * 50}ms">
        <div class="${gwuClass('bar-value')}">${day.count}</div>
        <div class="${gwuClass('bar')}" style="height: ${heightPercent}%"></div>
        <div class="${gwuClass('bar-label')}">${dayLabel}</div>
      </div>
    `;
  }).join('');

  const deltaSign = weeklyDelta.deltaPercent >= 0 ? '+' : '';
  const deltaColor = weeklyDelta.deltaPercent >= 0 ? '#22c55e' : '#ef4444';

  const bullshitDisplay = bullshit.isAnomaly
    ? `<span class="${gwuClass('bullshit-anomaly')}">+3367%</span>`
    : `+${bullshit.value}%`;

  return `
    <div id="${DASHBOARD_ID}" class="${gwuClass('dashboard')}">
      <div class="${gwuClass('dashboard-header')}">
        <h2 class="${gwuClass('dashboard-title')}">📊 Ton addiction en chiffres</h2>
        <p class="${gwuClass('dashboard-subtitle')}">Semaine glissante — ${weeklyDelta.thisWeek} requêtes
          <span style="color: ${deltaColor}">(${deltaSign}${weeklyDelta.deltaPercent}% vs semaine précédente)</span>
        </p>
      </div>

      <div class="${gwuClass('histogram')}">
        ${barsHTML}
      </div>

      <div class="${gwuClass('bullshit-section')}">
        <span class="${gwuClass('bullshit-label')}">📈 Tendance mensuelle :</span>
        <span class="${gwuClass('bullshit-value')}">${bullshitDisplay}</span>
      </div>

      <button class="${gwuClass('clear-btn')}" id="${gwuClass('clear-btn')}">
        🗑️ Effacer les preuves
      </button>
    </div>
  `;
}

import { registerWidget, unregisterWidget } from '../dom/overlay';

function injectDashboard(html: string) {
  // Remove existing
  removeDashboard();

  const container = document.createElement('div');
  container.id = gwuClass('dashboard-container');
  container.innerHTML = html;
  container.style.cssText = `
    position: absolute;
    z-index: 1000;
    pointer-events: auto;
  `;

  dashboardElement = container;

  registerWidget({
    id: 'stats-dashboard',
    element: container,
    updatePosition: () => {
      if (!dashboardElement) return;
      const anchor = findInputAreaAnchor();
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        // Position exactly below the input area
        dashboardElement!.style.top = `${rect.bottom + window.scrollY + 40}px`;
        dashboardElement!.style.left = `${rect.left + window.scrollX + rect.width / 2 - dashboardElement!.offsetWidth / 2}px`;
      } else {
        // Fallback positioning
        dashboardElement!.style.bottom = `80px`; // also lower the fallback
        dashboardElement!.style.left = `50%`;
        dashboardElement!.style.transform = `translateX(-50%)`;
      }
    }
  });

  // Wire up the clear button
  const clearBtn = container.querySelector(`#${gwuClass('clear-btn')}`);
  clearBtn?.addEventListener('click', handleClearClick);
}

function handleClearClick() {
  const dashboard = document.getElementById(DASHBOARD_ID);
  if (!dashboard) return;

  // 1. Hide the histogram bars (do not restore)
  const bars = dashboard.querySelectorAll(`.${gwuClass('bar')}`);
  bars.forEach(bar => {
    (bar as HTMLElement).style.height = '0%';
    (bar as HTMLElement).style.transition = 'height 1.5s ease-in-out';
  });
  
  // Also zero out the values
  const barValues = dashboard.querySelectorAll(`.${gwuClass('bar-value')}`);
  barValues.forEach(val => {
    val.textContent = '0';
  });

  // 2. Animate the weekly delta text down to -100%
  const subtitle = dashboard.querySelector(`.${gwuClass('dashboard-subtitle')}`);
  if (subtitle) {
    const span = subtitle.querySelector('span');
    if (span) {
      const match = span.textContent?.match(/[-+0-9]+/);
      if (match) {
        animateTextDownTo(span, parseInt(match[0], 10), -100, '% vs semaine précédente)', true);
      }
    }
  }

  // 3. Animate the monthly trend (bullshit stat) down to -100%
  const monthlySpan = dashboard.querySelector(`.${gwuClass('bullshit-value')}`);
  if (monthlySpan) {
    const targetSpan = monthlySpan.firstElementChild || monthlySpan;
    const match = targetSpan.textContent?.match(/[-+0-9]+/);
    if (match) {
      animateTextDownTo(targetSpan as HTMLElement, parseInt(match[0], 10), -100, '%', false);
    }
  }

  // Call the fake clear (does nothing to persistent storage)
  fakeClearStats();

  // Disable the button
  const clearBtn = document.getElementById(gwuClass('clear-btn')) as HTMLButtonElement;
  if (clearBtn) {
    clearBtn.disabled = true;
    clearBtn.textContent = "🗑️ Preuves supprimées...";
    clearBtn.style.opacity = '0.5';
    clearBtn.style.cursor = 'not-allowed';
  }
}

function animateTextDownTo(el: HTMLElement, start: number, end: number, suffix: string, includeParens: boolean) {
  let current = start;
  const duration = 1500;
  const stepTime = 16;
  const totalSteps = duration / stepTime;
  const decrement = Math.abs(start - end) / totalSteps;
  let exactCurrent = start;

  const timer = setInterval(() => {
    exactCurrent -= decrement;
    current = Math.floor(exactCurrent);
    
    if (current <= end) {
      current = end;
      clearInterval(timer);
    }
    
    const sign = current >= 0 ? '+' : '';
    const color = current >= 0 ? '#22c55e' : '#ef4444';
    
    let text = `${sign}${current}${suffix}`;
    if (includeParens) {
      text = `(${text}`; // The suffix already includes the closing parenthesis
    }
    
    el.textContent = text;
    el.style.color = color;
  }, stepTime);
}

async function refreshDashboard() {
  const html = await buildDashboardHTML();
  if (dashboardElement) {
    const dashEl = dashboardElement.querySelector(`#${DASHBOARD_ID}`);
    if (dashEl) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const newDash = temp.firstElementChild;
      if (newDash) {
        dashEl.replaceWith(newDash);
        // Rewire button
        const clearBtn = newDash.querySelector(`#${gwuClass('clear-btn')}`);
        clearBtn?.addEventListener('click', handleClearClick);
      }
    }
  }
}

function removeDashboard() {
  unregisterWidget('stats-dashboard');
  dashboardElement = null;
}

export async function showDashboard(): Promise<void> {
  if (!isHomePage()) return;
  const html = await buildDashboardHTML();
  injectDashboard(html);
}

export function hideDashboard(): void {
  removeDashboard();
}

export function handleDashboardNavigation(isHome: boolean): void {
  if (isHome) {
    showDashboard();
  } else {
    hideDashboard();
  }
}
