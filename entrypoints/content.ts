/**
 * content.ts — Main content script orchestrator
 * 
 * Injects into gemini.google.com and coordinates all GWU features.
 */

import '@/assets/styles.css';

import { initCentralObserver } from '@/modules/dom/observer';
import { isHomePage } from '@/modules/dom/selectors';
import { incrementTodayCount } from '@/modules/storage/stats-store';

// Features
import { initRedacted } from '@/modules/features/redacted';
import { initGlitch } from '@/modules/features/glitch';
import { handleDashboardNavigation, showDashboard } from '@/modules/features/stats-dashboard';
import { handleEyesNavigation, showEyes, updateEyesFatigue } from '@/modules/features/watching-eyes';
import { handleMeterNavigation, showPromptOMeter, updatePromptOMeter } from '@/modules/features/prompt-o-meter';
import { initCynicalPlaceholders } from '@/modules/features/cynical-placeholders';
import { initAntiShortPrompt } from '@/modules/features/anti-short-prompt';
import { attachPassiveLoader, initPassiveLoader } from '@/modules/features/passive-loader';
import { checkEcocideAchievement, initEcocide } from '@/modules/features/ecocide-achievement';
import { initHideChips } from '@/modules/features/hide-chips';

export default defineContentScript({
  matches: ['https://gemini.google.com/*'],
  runAt: 'document_idle',

  async main() {
    // ── Check if disabled ─────────────────────────────────
    const storage = await chrome.storage.local.get('gwuDisabledUntil');
    const disabledUntil = storage.gwuDisabledUntil;
    const now = Date.now();
    
    if (disabledUntil === -1 || (disabledUntil && disabledUntil > now)) {
      console.log('[GWU] 😴 GeminisWatchinU est actuellement désactivée.');
      return; // Do absolutely nothing
    }

    console.log('[GWU] 👁️ GeminisWatchinU initialized — On te surveille.');

    // ── Initialize all features ───────────────────────────
    const cleanups: (() => void)[] = [];

    // Redacted mode (sidebar masking)
    cleanups.push(await initRedacted());

    // Matrix glitch timer
    cleanups.push(initGlitch());

    // Cynical placeholders
    cleanups.push(initCynicalPlaceholders());

    // Anti-short-prompt filter
    cleanups.push(initAntiShortPrompt());

    // Passive-aggressive loader (cleanup only)
    cleanups.push(initPassiveLoader());

    // Ecocide achievement
    cleanups.push(initEcocide());

    // Hide suggestion chips ("Créer une image", etc.)
    cleanups.push(initHideChips());

    // ── Central observer for navigation + queries ─────────
    const cleanupObserver = initCentralObserver({
      onNavigation: (isHome, url) => {
        console.log(`[GWU] Navigation: ${isHome ? 'HOME' : 'CONVERSATION'} — ${url}`);
        // Order matters: eyes above input, dashboard below, meter below dashboard
        handleEyesNavigation(isHome);
        handleDashboardNavigation(isHome);
        handleMeterNavigation(isHome);
      },

      onUserQuery: async (_queryElement) => {
        console.log('[GWU] New user query detected');
        const todayCount = await incrementTodayCount();
        console.log(`[GWU] Today's count: ${todayCount}`);

        // Update home page widgets if visible
        updateEyesFatigue();
        updatePromptOMeter();

        // Check for ecocide achievement (40th request)
        checkEcocideAchievement();
      },

      onModelResponse: (responseElement) => {
        console.log('[GWU] Model response started (streaming)');
        attachPassiveLoader(responseElement);
      },
    });
    cleanups.push(cleanupObserver);

    // ── Listen for background messages ────────────────────
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'GWU_NAVIGATION') {
        handleEyesNavigation(isHomePage());
        handleDashboardNavigation(isHomePage());
        handleMeterNavigation(isHomePage());
      }
    });

    // Note: initial render is handled by the observer's initial
    // onNavigation fire (line 88 in observer.ts), no need to call
    // showEyes/showDashboard/showPromptOMeter manually here.
  },
});
