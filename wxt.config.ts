import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'GeminisWatchinU',
    description: 'Extension parodique et utilitaire pour Gemini — Surveille, juge et culpabilise.',
    version: '1.0.0',
    permissions: ['storage', 'webNavigation'],
    host_permissions: ['https://gemini.google.com/*'],
  },
});
