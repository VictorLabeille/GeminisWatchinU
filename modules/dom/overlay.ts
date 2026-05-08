/**
 * overlay.ts — Overlay Positioning System
 * Creates an invisible overlay layer to host widgets securely without breaking Gemini's DOM.
 */

import { gwuClass } from './selectors';

const OVERLAY_ID = gwuClass('overlay-layer');

export interface OverlayWidget {
  id: string;
  element: HTMLElement;
  updatePosition: () => void;
}

const widgets: OverlayWidget[] = [];
let overlayElement: HTMLElement | null = null;
let animationFrameId: number | null = null;

function createOverlay(): HTMLElement {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none; /* Let clicks pass through to Gemini */
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function updatePositions() {
  for (const widget of widgets) {
    widget.updatePosition();
  }
  animationFrameId = requestAnimationFrame(updatePositions);
}

export function initOverlay() {
  if (!overlayElement) {
    overlayElement = createOverlay();
    animationFrameId = requestAnimationFrame(updatePositions);
  }
}

export function registerWidget(widget: OverlayWidget) {
  initOverlay();
  
  // Ensure the widget element accepts pointer events if needed
  // widget.element.style.pointerEvents = 'auto'; // Depending on the widget, they might set this themselves.

  // Remove existing widget with the same ID
  const existingIdx = widgets.findIndex(w => w.id === widget.id);
  if (existingIdx !== -1) {
    widgets[existingIdx].element.remove();
    widgets.splice(existingIdx, 1);
  }

  widgets.push(widget);
  overlayElement!.appendChild(widget.element);
}

export function unregisterWidget(id: string) {
  const existingIdx = widgets.findIndex(w => w.id === id);
  if (existingIdx !== -1) {
    widgets[existingIdx].element.remove();
    widgets.splice(existingIdx, 1);
  }
}

export function cleanupOverlay() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  widgets.length = 0;
}
