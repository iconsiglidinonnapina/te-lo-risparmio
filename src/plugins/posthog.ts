import posthog from 'posthog-js';
import type { App } from 'vue';

export const posthogPlugin = {
  install(app: App) {
    const apiKey = import.meta.env.VITE_POSTHOG_KEY;

    if (!apiKey) {
      return;
    }

    posthog.init(apiKey, {
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: false,
      persistence: 'localStorage',
      respect_dnt: true,
    });

    app.provide('posthog', posthog);
  },
};
