import { ref } from 'vue';
import { defineStore } from 'pinia';
import { apiFetch } from '@/api/client';
import { evaluatePrice } from '@/utils/price-evaluator';
import { useAnalytics } from '@/composables/useAnalytics';
import type {
  AppState,
  LoadingStep,
  ProductResponse,
  AlternativesResponse,
  AlternativeProduct,
  CategorizedAlternatives,
  PriceEvaluation,
} from '@/types/analysis';

export const useAnalysisStore = defineStore('analysis', () => {
  const { trackEvent } = useAnalytics();
  const appState = ref<AppState>('input');
  const loadingStep = ref<LoadingStep>('fetching-product');
  const product = ref<ProductResponse | null>(null);
  const alternatives = ref<AlternativeProduct[]>([]);
  const categorizedAlternatives = ref<CategorizedAlternatives | null>(null);
  const evaluation = ref<PriceEvaluation | null>(null);
  const error = ref<string | null>(null);

  /**
   * Resolves a short Amazon link (amzn.eu, amzn.to, etc.) to an ASIN
   * via the backend validation endpoint.
   */
  async function resolveShortLink(url: string): Promise<string> {
    const data = await apiFetch<{ valid: boolean; asin: string }>('/api/validate-link', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    if (!data.valid || !data.asin) {
      throw new Error('Impossibile risolvere il link breve');
    }
    return data.asin;
  }

  async function analyze(asin: string, shortLinkUrl?: string) {
    trackEvent('url_submitted', {
      has_asin: !!asin,
      is_short_link: !!shortLinkUrl,
    });

    appState.value = 'loading';
    error.value = null;
    product.value = null;
    alternatives.value = [];
    categorizedAlternatives.value = null;
    evaluation.value = null;

    try {
      // If we have a short link URL without an ASIN, resolve it first
      let resolvedAsin = asin;
      if (!resolvedAsin && shortLinkUrl) {
        loadingStep.value = 'resolving-link';
        resolvedAsin = await resolveShortLink(shortLinkUrl);
      }

      if (!resolvedAsin) {
        throw new Error('Impossibile determinare il prodotto dal link fornito');
      }

      loadingStep.value = 'fetching-product';
      const productData = await apiFetch<ProductResponse>(
        `/api/product/${encodeURIComponent(resolvedAsin)}`,
      );
      product.value = productData;

      loadingStep.value = 'fetching-alternatives';
      try {
        const altData = await apiFetch<AlternativesResponse>(
          `/api/alternatives/${encodeURIComponent(resolvedAsin)}`,
        );
        alternatives.value = altData.alternatives;

        // Use backend categorization or compute client-side fallback
        if (altData.categorized) {
          categorizedAlternatives.value = altData.categorized;
        } else if (productData.price) {
          const p = productData.price.amount;
          categorizedAlternatives.value = {
            cheaper: altData.alternatives.filter(
              (a) => a.price !== null && a.price.amount < p * 0.95,
            ),
            similar: altData.alternatives.filter(
              (a) => a.price !== null && a.price.amount >= p * 0.95 && a.price.amount <= p * 1.1,
            ),
            higher: altData.alternatives.filter(
              (a) => a.price !== null && a.price.amount > p * 1.1,
            ),
          };
        }
      } catch {
        alternatives.value = [];
        categorizedAlternatives.value = null;
      }

      evaluation.value = evaluatePrice(
        productData,
        alternatives.value,
        categorizedAlternatives.value,
      );

      trackEvent('analysis_completed', {
        asin: resolvedAsin,
        price_color: evaluation.value.color,
        has_alternatives: alternatives.value.length > 0,
        alternatives_count: alternatives.value.length,
      });

      appState.value = 'result';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Errore sconosciuto';

      trackEvent('analysis_failed', {
        error_message: error.value,
      });

      appState.value = 'error';
    }
  }

  function reset() {
    appState.value = 'input';
    loadingStep.value = 'fetching-product';
    product.value = null;
    alternatives.value = [];
    categorizedAlternatives.value = null;
    evaluation.value = null;
    error.value = null;
  }

  return {
    appState,
    loadingStep,
    product,
    alternatives,
    categorizedAlternatives,
    evaluation,
    error,
    analyze,
    reset,
  };
});
