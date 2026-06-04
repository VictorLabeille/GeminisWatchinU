# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**GeminisWatchinU** (GWU) is a parody/utility browser extension that runs *only* on `gemini.google.com`. It injects privacy theater (sidebar "redacted" mode), usage statistics, gamified judgment widgets, and sarcastic UI frictions. The product spec lives in `spec.md` (French, authoritative for feature behavior); `README.md` summarizes features. Much of the user-facing copy is intentionally French and cynical — preserve tone when editing strings.

> **Keep the docs in sync.** On every feature change (add / remove / behavior change), update **both** `spec.md` (the authoritative feature behavior) **and** this `CLAUDE.md` (architecture/conventions) in the same change. Do not let code drift ahead of the docs.

## Commands

```bash
npm install         # install deps
npm run dev         # WXT dev server with HMR (launches a browser with the extension loaded)
npm run build       # production build into .output/
npm run zip         # build + package a .zip for manual install (drag into chrome://extensions)
```

There is no test suite, linter, or formatter configured. Type checking comes from `tsc` via WXT's strict tsconfig (`noUnusedLocals`/`noUnusedParameters` are off). To install a built extension manually: `chrome://extensions` → enable Developer Mode → drop the `.output/*.zip` or load the unzipped folder.

## Architecture

Built with **WXT** (`wxt.config.ts`) over Vite. WXT auto-generates the manifest (MV3) and provides the `defineContentScript` / `defineBackground` globals — there is no hand-written `manifest.json`. Permissions: `storage`, `webNavigation`; host: `https://gemini.google.com/*`.

Three entrypoints under `entrypoints/`:

- **`content.ts`** — the orchestrator. Injected at `document_idle`. First checks `gwuDisabledUntil` in storage and bails entirely if the extension is paused. Otherwise it calls every feature's `init*()` (each returns a cleanup fn, collected into a `cleanups` array — features are mounted here, so removing a feature means dropping its `init*()` call/import) and wires the central observer's three callbacks (`onNavigation`, `onUserQuery`, `onModelResponse`) to the home-page widgets and the stats counter.
- **`background.ts`** — service worker. Detects Gemini's SPA navigation via `chrome.webNavigation.onHistoryStateUpdated` and relays `GWU_NAVIGATION` to the content script. Also brokers redacted-mode toggles and tab reloads between popup and content scripts via `chrome.runtime` messages.
- **`popup/`** — the toolbar popup (plain HTML + `main.ts`). Toggles redacted mode and sets `gwuDisabledUntil` (a timestamp, or `-1` for "disabled forever", or `0`/absent for "enabled"). Pausing triggers `GWU_RELOAD_TABS`.

### Modules (`modules/`)

- **`dom/observer.ts`** — single shared `MutationObserver` + history patching. It monkey-patches `history.pushState`/`replaceState` and listens to `popstate` to detect SPA route changes, and watches `document.body` subtree for new `user-query` / `model-response` custom elements. **All DOM-watching should go through this central observer rather than spawning new top-level observers.**
- **`dom/selectors.ts`** — every Gemini DOM selector lives here, centralized because Gemini's markup is volatile. Targets Custom Element tag names first (most stable), with ARIA/class fallbacks, and supports both **French and English** Gemini UIs. Also exports `isHomePage()`/`isConversationPage()` (path-based) and the layout-anchor finders. Use `gwuClass(name)` → `gwu-<name>` for all injected class names to avoid collisions.
- **`dom/shadow-utils.ts`** — Gemini renders much of its chrome (notably the sidebar `bard-sidenav`) inside Shadow DOM. Use these helpers (`queryShadow`, `deepQueryShadow`, `observeShadowHost`, `injectShadowStyle`, `waitForElement`) to cross shadow boundaries — normal `document.querySelector` won't reach inside.
- **`theme/theme.ts`** — adaptive light/dark theming. All widget colors are **CSS custom properties** (`--gwu-*`, defined in `assets/styles.css`) with two palettes: a dark default on `:root` and a light override on `:root[data-gwu-theme="light"]`. `initTheme()` (mounted **first** in `content.ts`) follows **Gemini's own theme**: `detectGeminiTheme()` reads `<body>`'s `dark-theme`/`light-theme` class (fallback: body background luminance, then `prefers-color-scheme`) and sets `data-gwu-theme` on `<html>`; a `MutationObserver` on `<body>`'s class re-applies live when the user toggles Gemini's theme. There is **no user control** (Auto only, no stored preference). The accent is **Gemini's gradient** (`#4285f4 → #9b72cb → #d96570`), not a GWU brand color. For dynamic colors set from JS, read the resolved token with `gwuToken('--gwu-name')` (used by the dashboard delta) so they track the active theme. **Semantic/parody colors stay fixed and are NOT tokenized**: the Redacted black `#111` (ink), the Matrix green, the eye whites and blood-red fatigue veins; the Prompt-O-Meter `LEVELS` colors are literal mid-tones chosen to read on both themes. The popup is a separate context that can't read Gemini's theme, so it mirrors the same tokens but follows the OS `prefers-color-scheme` (set in `popup/index.html` + `popup/main.ts`).
- **`dom/overlay.ts`** — a `position:absolute`, `pointer-events:none` overlay layer (`z-index:100`) appended to `body`. All three home widgets (dashboard, eyes, prompt-o-meter) share this single layer (one stacking context), so per-widget `z-index` only orders them relative to each other, not relative to the page. **Important:** because the layer is a separate body-level element, no `z-index` value can reliably push a widget *behind* a menu Gemini renders inside its own app container — so "don't cover Gemini's menus" is solved at the widget level instead: a widget's `updatePosition()` calls `isGeminiOverlayOpen()` (in `selectors.ts`, detects the Angular CDK backdrop/pane) and hides itself while a Gemini menu is open (the stats dashboard does this). Widgets register via `registerWidget({id, element, updatePosition})`; a `requestAnimationFrame` loop calls every widget's `updatePosition()` each frame so they track Gemini's layout (and re-check menu state) without mutating Gemini's DOM.
- **`storage/stats-store.ts`** — the single source of truth for `chrome.storage.local`. Daily request counts are keyed by ISO date and kept indefinitely (display is windowed to 7 days). Note the "bullshit" monthly stat (`generateBullshitSeed`, regenerated once/day, 10% chance of the `+3367%` anomaly) and `fakeClearStats()` which is a deliberate no-op dark pattern — do **not** "fix" it to actually clear data.
- **`features/*.ts`** — one file per feature. **Convention:** each exports an `init<Feature>(): () => void` (or `Promise<() => void>`) that sets up and returns a cleanup function. Home-page-only widgets (eyes, dashboard, prompt-o-meter) additionally export a `handle<Feature>Navigation(isHome)`, `show<Feature>`, and `update<Feature>` so `content.ts` can mount/unmount them on route changes and refresh them on each new query.

### Key data flows

- **New user query** → observer's `onUserQuery` → `incrementTodayCount()` → refresh eyes fatigue + prompt-o-meter + check the 40th-message "Écocide" achievement.
- **Navigation** → observer (`onNavigation`) *and* background message (`GWU_NAVIGATION`) both call the three `handle*Navigation(isHomePage())` handlers. Home widgets only render on the home page and are torn down inside conversations.
- **Redacted toggle** → popup sends `GWU_SET_REDACTED` → background persists `redactedEnabled` and broadcasts `GWU_REDACTED_CHANGED` to all Gemini tabs → `redacted.ts` reacts (it also listens to `storage.onChanged` directly).

## Working notes

- When Gemini changes its markup and a feature breaks, the fix almost always belongs in `dom/selectors.ts`, not scattered through feature files.
- Injected styles for shadow-DOM hosts must be injected *into the shadow root* (`injectShadowStyle`), not `<head>`.
- Keep injected DOM additive and removable — features must mount over Gemini's UI (overlay layer or `::after` blocks) and fully clean up via their returned cleanup fn; don't rewrite Gemini's own nodes.
- New surface/text/border/accent colors must go through the `--gwu-*` tokens (define both the dark default and the light override), never hardcoded hex — otherwise they won't adapt when Gemini switches theme. Only genuinely theme-independent parody colors (redaction ink, Matrix green, eye blood) stay literal.
