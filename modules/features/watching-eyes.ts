/**
 * watching-eyes.ts — Widget "Watching You" (Eye Tracking)
 * Displayed on home page only.
 */

import { gwuClass, isHomePage, findGreetingAnchor, findInputAreaAnchor, findMainContentArea } from '../dom/selectors';
import { getTodayCount } from '../storage/stats-store';

const EYES_ID = gwuClass('eyes-widget');
let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;
let animFrameId: number | null = null;
let morphIntervalId: ReturnType<typeof setInterval> | null = null;
let eyesElement: HTMLElement | null = null;
let todayCount = 0;

const PUPIL_SHAPES = [
  'circle(50%)',
  'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
  'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
  'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)',
];

function buildEyesHTML(fatigue: number): string {
  const intensity = Math.min(fatigue / 50, 1);
  const bColor = `rgba(220,38,38,${intensity * 0.6})`;
  const vOpacity = Math.min(intensity * 1.2, 1);
  const pClass = fatigue >= 36 ? gwuClass('pupil-critical') : gwuClass('pupil');
  const eye = (s: string) => `<div class="${gwuClass('eye')}"><div class="${gwuClass('eye-white')}" style="box-shadow:inset 0 0 ${8+intensity*15}px ${bColor}"><div class="${gwuClass('eye-veins')}" style="opacity:${vOpacity}"></div><div class="${pClass}" data-side="${s}"><div class="${gwuClass('pupil-inner')}"></div></div></div></div>`;
  return `<div id="${EYES_ID}" class="${gwuClass('eyes-container')}"><div class="${gwuClass('eyes')}">${eye('left')}${eye('right')}</div></div>`;
}

function animateEyes() {
  if (!eyesElement) return;
  const eyes = eyesElement.querySelector(`.${gwuClass('eyes')}`);
  if (!eyes) return;
  const rect = eyes.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const dx = mouseX - cx, dy = mouseY - cy;
  const angle = Math.atan2(dy, dx);
  const dist = Math.min(Math.hypot(dx, dy) / 20, 8);
  const tx = Math.cos(angle) * dist, ty = Math.sin(angle) * dist;
  currentX += (tx - currentX) * 0.15;
  currentY += (ty - currentY) * 0.15;
  eyesElement.querySelectorAll(`.${gwuClass('pupil')},.${gwuClass('pupil-critical')}`).forEach((p) => {
    (p as HTMLElement).style.transform = `translate(${currentX}px,${currentY}px)`;
  });
  animFrameId = requestAnimationFrame(animateEyes);
}

function startMorphing() {
  morphIntervalId = setInterval(() => {
    if (!eyesElement || Math.random() > 0.3 || todayCount >= 36) return;
    const shape = PUPIL_SHAPES[Math.floor(Math.random() * PUPIL_SHAPES.length)];
    eyesElement.querySelectorAll(`.${gwuClass('pupil-inner')}`).forEach((el) => {
      (el as HTMLElement).style.clipPath = shape;
      setTimeout(() => { (el as HTMLElement).style.clipPath = 'circle(50%)'; }, 800);
    });
  }, 5000);
}

function onMouse(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }

import { registerWidget, unregisterWidget } from '../dom/overlay';

export async function showEyes(): Promise<void> {
  if (!isHomePage()) return;
  removeEyes();
  todayCount = await getTodayCount();
  const container = document.createElement('div');
  container.id = gwuClass('eyes-outer');
  // Need to add absolute positioning for overlay
  container.style.position = 'absolute';
  container.innerHTML = buildEyesHTML(todayCount);

  eyesElement = container;
  
  registerWidget({
    id: 'watching-eyes',
    element: container,
    updatePosition: () => {
      if (!eyesElement) return;
      const anchor = findGreetingAnchor();
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        // Position eyes centrally above the greeting anchor
        // Add scrollY to bounding client rect because overlay is relative to page
        eyesElement.style.top = `${rect.top + window.scrollY - 100}px`;
        eyesElement.style.left = `${rect.left + window.scrollX + rect.width / 2 - eyesElement.offsetWidth / 2}px`;
      } else {
        // Fallback positioning
        eyesElement.style.top = `100px`;
        eyesElement.style.left = `50%`;
        eyesElement.style.transform = `translateX(-50%)`;
      }
    }
  });

  document.addEventListener('mousemove', onMouse);
  animFrameId = requestAnimationFrame(animateEyes);
  startMorphing();
}

export function removeEyes(): void {
  unregisterWidget('watching-eyes');
  eyesElement = null;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (morphIntervalId) clearInterval(morphIntervalId);
  animFrameId = null; morphIntervalId = null;
  document.removeEventListener('mousemove', onMouse);
  currentX = 0; currentY = 0;
}

export async function updateEyesFatigue(): Promise<void> {
  if (eyesElement && isHomePage()) { removeEyes(); await showEyes(); }
}

export function handleEyesNavigation(isHome: boolean): void {
  if (isHome) showEyes(); else removeEyes();
}
