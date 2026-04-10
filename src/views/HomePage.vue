<script setup lang="ts">
import { useAnalysisStore } from '@/stores/analysis';
import UrlInput from '@/components/UrlInput.vue';
import LoadingState from '@/components/LoadingState.vue';
import ResultView from '@/components/ResultView.vue';
import ErrorState from '@/components/ErrorState.vue';

const store = useAnalysisStore();

function handleSubmit(asin: string, shortLinkUrl?: string) {
  void store.analyze(asin, shortLinkUrl);
}

function handleReset() {
  store.reset();
}
</script>

<template>
  <main id="maincontent" tabindex="-1" class="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4">
    <!-- INPUT state -->
    <div
      v-if="store.appState === 'input'"
      class="my-auto flex flex-col items-center py-12 text-center"
    >
      <h1
        class="mb-2 text-[clamp(2rem,5vw,2.8rem)] font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100"
      >
        Il prezzo è<span style="margin-left: 0.35em"></span
        ><span class="highlight-box">giusto?</span>
      </h1>
      <p class="mx-auto mb-10 max-w-130 text-[1.05rem] text-gray-600 dark:text-gray-400">
        Incolla un link Amazon per scoprire se stai<br class="hidden sm:inline" />
        facendo un buon affare o se ci sono alternative migliori.
      </p>
      <UrlInput @submit="handleSubmit" />
    </div>

    <!-- LOADING state -->
    <div v-else-if="store.appState === 'loading'" class="py-6">
      <LoadingState :step="store.loadingStep" />
    </div>

    <!-- RESULT state -->
    <div v-else-if="store.appState === 'result' && store.product && store.evaluation" class="py-6">
      <ResultView
        :product="store.product"
        :alternatives="store.alternatives"
        :categorized="store.categorizedAlternatives"
        :evaluation="store.evaluation"
        @reset="handleReset"
      />
    </div>

    <!-- ERROR state -->
    <div v-else-if="store.appState === 'error' && store.error" class="py-6">
      <ErrorState :message="store.error" @retry="handleReset" />
    </div>
  </main>
</template>
