<script setup lang="ts">
import UrlInput from '@/components/UrlInput.vue';

function handleSubmit(_asin: string) {
  // TODO: Epic 3+ — navigate to loading/result state with ASIN
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
    class="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col items-center justify-center px-4"
  >
    <div class="w-full text-center">
      <h1 class="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">Il prezzo è giusto?</h1>
      <p class="mb-8 text-lg text-gray-600">
        Incolla un link Amazon per scoprire se stai facendo un buon affare.
      </p>

      <UrlInput @submit="handleSubmit" />
    </div>
  </main>

  <footer class="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
    <p>In qualità di Affiliato Amazon, ricevo un guadagno per ciascun acquisto idoneo.</p>
  </footer>
</template>
