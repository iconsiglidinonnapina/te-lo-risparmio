import { ref } from 'vue';
import { defineStore } from 'pinia';
import { apiFetch } from '@/api/client';
import { evaluatePrice } from '@/utils/price-evaluator';
import type {
  AppState,
  LoadingStep,
  ProductResponse,
  AlternativesResponse,
  AlternativeProduct,
  PriceEvaluation,
} from '@/types/analysis';

export const useAnalysisStore = defineStore('analysis', () => {
  const appState = ref<AppState>('input');
  const loadingStep = ref<LoadingStep>('fetching-product');
  const product = ref<ProductResponse | null>(null);
  const alternatives = ref<AlternativeProduct[]>([]);
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
    appState.value = 'loading';
    error.value = null;
    product.value = null;
    alternatives.value = [];
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
      } catch {
        alternatives.value = [];
      }

      evaluation.value = evaluatePrice(productData, alternatives.value);
      appState.value = 'result';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Errore sconosciuto';
      appState.value = 'error';
    }
  }

  function reset() {
    appState.value = 'input';
    loadingStep.value = 'fetching-product';
    product.value = null;
    alternatives.value = [];
    evaluation.value = null;
    error.value = null;
  }

  return {
    appState,
    loadingStep,
    product,
    alternatives,
    evaluation,
    error,
    analyze,
    reset,
  };
});
