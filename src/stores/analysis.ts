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

  async function analyze(asin: string) {
    appState.value = 'loading';
    error.value = null;
    product.value = null;
    alternatives.value = [];
    evaluation.value = null;

    try {
      loadingStep.value = 'fetching-product';
      const productData = await apiFetch<ProductResponse>(
        `/api/product/${encodeURIComponent(asin)}`,
      );
      product.value = productData;

      loadingStep.value = 'fetching-alternatives';
      try {
        const altData = await apiFetch<AlternativesResponse>(
          `/api/alternatives/${encodeURIComponent(asin)}`,
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
