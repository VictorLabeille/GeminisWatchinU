/**
 * theme.ts — Adaptive light/dark theming for GWU widgets
 *
 * GWU's injected widgets use CSS custom properties (`--gwu-*`, defined in
 * `assets/styles.css`). This module decides whether GWU should render its
 * dark or light token set by *following Gemini's own theme*, and exposes that
 * choice as a `data-gwu-theme="dark|light"` attribute on `<html>`.
 *
 * There is no user-facing control (Auto only): when the user switches Gemini's
 * theme (Light / Dark / System), a MutationObserver on `<body>`'s class picks
 * it up and re-applies live.
 */

type GwuTheme = 'dark' | 'light';

const THEME_ATTR = 'data-gwu-theme';

/**
 * Relative luminance (0..1) of a CSS `rgb()/rgba()` color string.
 * Returns null when the color can't be parsed (e.g. "transparent").
 */
function luminanceOf(color: string): number | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  const [r, g, b, a] = parts;
  // Fully transparent backgrounds tell us nothing about the theme.
  if (a !== undefined && a === 0) return null;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  // Perceived luminance (sRGB approximation), normalized to 0..1.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Detect Gemini's current theme.
 *
 * Gemini is an Angular Material app that toggles `dark-theme` / `light-theme`
 * classes on <body>. We trust those first, then fall back to the body's
 * computed background luminance, then to the OS preference.
 */
export function detectGeminiTheme(): GwuTheme {
  const body = document.body;

  if (body) {
    if (body.classList.contains('dark-theme')) return 'dark';
    if (body.classList.contains('light-theme')) return 'light';

    const bg = getComputedStyle(body).backgroundColor;
    const lum = luminanceOf(bg);
    if (lum !== null) return lum < 0.5 ? 'dark' : 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply a resolved theme to the document root (drives the `--gwu-*` tokens). */
export function applyGwuTheme(theme: GwuTheme): void {
  document.documentElement.setAttribute(THEME_ATTR, theme);
}

/**
 * Read a resolved `--gwu-*` token value for use in JS-set inline styles, so
 * dynamic colors track the active theme without duplicating the palette here.
 */
export function gwuToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Initialize adaptive theming. Applies once, then re-applies whenever Gemini's
 * theme changes (body class) or the OS preference flips (fallback path).
 * Returns a cleanup function.
 */
export function initTheme(): () => void {
  const reapply = () => applyGwuTheme(detectGeminiTheme());
  reapply();

  // React to Gemini toggling its theme classes on <body>.
  const observer = new MutationObserver(reapply);
  if (document.body) {
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // Fallback path: when detection relies on prefers-color-scheme.
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', reapply);

  return () => {
    observer.disconnect();
    mql.removeEventListener('change', reapply);
  };
}
