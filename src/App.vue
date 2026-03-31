<script setup lang="ts">
import { useAnalysisStore } from '@/stores/analysis';
import { useDarkMode } from '@/composables/useDarkMode';
import UrlInput from '@/components/UrlInput.vue';
import LoadingState from '@/components/LoadingState.vue';
import ResultView from '@/components/ResultView.vue';
import ErrorState from '@/components/ErrorState.vue';

const store = useAnalysisStore();
const { isDark, toggle: toggleDark } = useDarkMode();

function handleSubmit(asin: string) {
  void store.analyze(asin);
}

function handleReset() {
  store.reset();
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#maincontent"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-teal-700 focus:shadow-md dark:focus:bg-gray-950 dark:focus:text-teal-300"
    >
      Vai al contenuto principale
    </a>

    <header class="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Amazon Price Advisor</p>
        <button
          type="button"
          role="switch"
          :aria-checked="isDark"
          :aria-label="isDark ? 'Attiva modalità chiara' : 'Attiva modalità scura'"
          class="relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          :class="isDark ? 'bg-gray-600' : 'bg-gray-300'"
          @click="toggleDark"
        >
          <span
            class="pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform dark:bg-gray-200"
            :class="isDark ? 'translate-x-7' : 'translate-x-0.5'"
          >
            <!-- Sun icon -->
            <svg
              v-if="!isDark"
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 text-amber-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clip-rule="evenodd"
              />
            </svg>
            <!-- Moon icon -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </span>
        </button>
      </div>
    </header>

    <main
      id="maincontent"
      tabindex="-1"
      class="mx-auto w-full max-w-4xl flex-1 px-4"
      :class="
        store.appState === 'input'
          ? 'flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center'
          : 'py-6'
      "
    >
      <!-- INPUT state -->
      <div v-if="store.appState === 'input'" class="w-full text-center">
        <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Il prezzo è giusto?
        </h1>
        <p class="mb-8 text-lg text-gray-600 dark:text-gray-400">
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

    <footer
      class="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-500"
    >
      <p>In qualità di Affiliato Amazon, ricevo un guadagno per ciascun acquisto idoneo.</p>
    </footer>
  </div>
</template>
