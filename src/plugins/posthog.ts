import posthog from 'posthog-js';
import type { App } from 'vue';

function stripQueryParams(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

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
      sanitize_properties(properties) {
        // Strip full Amazon URLs which may contain personal search queries
        if (properties['$current_url']) {
          properties['$current_url'] = stripQueryParams(properties['$current_url'] as string);
        }
        if (properties['$referrer']) {
          properties['$referrer'] = stripQueryParams(properties['$referrer'] as string);
        }
        return properties;
      },
    });

    app.provide('posthog', posthog);
  },
};
