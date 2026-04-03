import posthog from 'posthog-js';

function isActive(): boolean {
  return !!import.meta.env.VITE_POSTHOG_KEY;
}

export function useAnalytics() {
  function trackEvent(name: string, properties?: Record<string, unknown>) {
    if (!isActive()) return;
    posthog.capture(name, properties);
  }

  return { trackEvent };
}
