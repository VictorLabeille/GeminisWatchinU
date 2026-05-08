/**
 * glitch.ts — Matrix Glitch Paranoïaque
 * 
 * At exactly :15, :30, or :45 minutes, one random redacted block
 * in the sidebar shows a Matrix rain animation for ~800ms.
 */

import { gwuClass } from '../dom/selectors';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF';

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTriggeredMinute = -1;

function getRandomRedactedBlock(): HTMLElement | null {
  // Try to find conversation links in sidebar (with or without shadow DOM)
  const sidebar = document.querySelector('bard-sidenav, [role="navigation"]');
  let links: Element[] = [];

  if (sidebar?.shadowRoot) {
    links = Array.from(sidebar.shadowRoot.querySelectorAll('a[href*="/app/"]'));
  } else if (sidebar) {
    links = Array.from(sidebar.querySelectorAll('a[href*="/app/"]'));
  }

  if (links.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * links.length);
  return links[randomIndex] as HTMLElement;
}

function triggerMatrixGlitch(targetBlock: HTMLElement) {
  // Ensure the block has position relative for canvas overlay
  const originalPosition = targetBlock.style.position;
  targetBlock.style.position = 'relative';

  const canvas = document.createElement('canvas');
  const rect = targetBlock.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.className = gwuClass('matrix-canvas');
  canvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999;
    border-radius: 3px;
  `;
  targetBlock.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const fontSize = 10;
  const columns = Math.max(Math.floor(canvas.width / fontSize), 1);
  const drops = new Array(columns).fill(0);

  let frames = 0;
  const maxFrames = 402; // 6.7s at 60fps

  function draw() {
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f0';
    ctx.font = `${fontSize}px monospace`;
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 3;

    for (let i = 0; i < drops.length; i++) {
      const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height || Math.random() > 0.92) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    frames++;
    if (frames < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      // Fade out
      canvas.style.transition = 'opacity 0.2s ease-out';
      canvas.style.opacity = '0';
      setTimeout(() => {
        canvas.remove();
        targetBlock.style.position = originalPosition;
      }, 200);
    }
  }

  requestAnimationFrame(draw);
}

function checkAndTrigger() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Trigger at exactly :15, :30, or :45 (with a 2-second window)
  const isTargetMinute = minutes === 15 || minutes === 30 || minutes === 45;

  if (isTargetMinute && seconds < 2 && lastTriggeredMinute !== minutes) {
    lastTriggeredMinute = minutes;

    const block = getRandomRedactedBlock();
    if (block) {
      triggerMatrixGlitch(block);
    }
  }

  // Reset after the minute passes
  if (!isTargetMinute) {
    lastTriggeredMinute = -1;
  }
}

export function initGlitch(): () => void {
  // Check every second
  intervalId = setInterval(checkAndTrigger, 1000);

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
