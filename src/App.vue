<script setup lang="ts">
import { useAnalysisStore } from '@/stores/analysis';
import UrlInput from '@/components/UrlInput.vue';
import LoadingState from '@/components/LoadingState.vue';
import ResultView from '@/components/ResultView.vue';
import ErrorState from '@/components/ErrorState.vue';

const store = useAnalysisStore();

function handleSubmit(asin: string) {
  void store.analyze(asin);
}

function handleReset() {
  store.reset();
}
</script>

<template>
  <a
    href="#maincontent"
    class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:shadow-md"
  >
    Vai al contenuto principale
  </a>

  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-4xl px-4 py-4">
      <p class="text-sm font-medium text-gray-500">Amazon Price Advisor</p>
    </div>
  </header>

  <main
    id="maincontent"
    tabindex="-1"
    class="mx-auto max-w-4xl px-4"
    :class="
      store.appState === 'input'
        ? 'flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center'
        : 'py-6'
    "
  >
    <!-- INPUT state -->
    <div v-if="store.appState === 'input'" class="w-full text-center">
      <h1 class="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Il prezzo è giusto?</h1>
      <p class="mb-8 text-lg text-gray-600">
        Incolla un link Amazon per scoprire se stai facendo un buon affare.
      </p>
      <UrlInput @submit="handleSubmit" />
    </div>

    <!-- LOADING state -->
    <LoadingState v-else-if="store.appState === 'loading'" :step="store.loadingStep" />

    <!-- RESULT state -->
    <ResultView
      v-else-if="store.appState === 'result' && store.product && store.evaluation"
      :product="store.product"
      :alternatives="store.alternatives"
      :evaluation="store.evaluation"
      @reset="handleReset"
    />

    <!-- ERROR state -->
    <ErrorState
      v-else-if="store.appState === 'error' && store.error"
      :message="store.error"
      @retry="handleReset"
    />
  </main>

  <footer class="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
    <p>In qualità di Affiliato Amazon, ricevo un guadagno per ciascun acquisto idoneo.</p>
  </footer>
</template>
