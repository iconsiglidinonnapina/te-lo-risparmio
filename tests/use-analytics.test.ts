import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}));

import posthog from 'posthog-js';
import { useAnalytics } from '../src/composables/useAnalytics';

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call posthog.capture when VITE_POSTHOG_KEY is missing', () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '');

    const { trackEvent } = useAnalytics();
    trackEvent('test_event', { foo: 'bar' });

    expect(posthog.capture).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('calls posthog.capture when VITE_POSTHOG_KEY is set', () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');

    const { trackEvent } = useAnalytics();
    trackEvent('url_submitted', { has_asin: true });

    expect(posthog.capture).toHaveBeenCalledWith('url_submitted', { has_asin: true });

    vi.unstubAllEnvs();
  });

  it('passes undefined properties gracefully', () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key');

    const { trackEvent } = useAnalytics();
    trackEvent('new_search_clicked');

    expect(posthog.capture).toHaveBeenCalledWith('new_search_clicked', undefined);

    vi.unstubAllEnvs();
  });
});
