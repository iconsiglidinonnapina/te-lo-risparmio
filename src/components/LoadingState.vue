<script setup lang="ts">
import { Vue3Lottie } from 'vue3-lottie';
import type { LoadingStep } from '@/types/analysis';
import animationData from '@/assets/animation/crypto-savings-concept-illustration-2025-10-20-04-38-53-utc.json';

defineProps<{
  step: LoadingStep;
}>();

const steps: { key: LoadingStep; label: string }[] = [
  { key: 'resolving-link', label: 'Risoluzione link in corso…' },
  { key: 'fetching-product', label: 'Recupero dati prodotto…' },
  { key: 'fetching-alternatives', label: 'Ricerca alternative…' },
];
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-8" role="status" aria-live="polite">
    <Vue3Lottie
      :animation-data="animationData"
      :height="200"
      :width="200"
      :loop="true"
      :auto-play="true"
      aria-hidden="true"
    />

    <p class="text-lg font-medium text-gray-700 dark:text-gray-300">Analisi in corso</p>

    <ol class="space-y-2">
      <li
        v-for="(s, index) in steps"
        :key="s.key"
        class="flex items-center gap-2 text-sm"
        :class="[
          step === s.key
            ? 'font-medium text-teal-700 dark:text-teal-400'
            : index < steps.findIndex((x) => x.key === step)
              ? 'text-green-700 dark:text-green-400'
              : 'text-gray-400 dark:text-gray-500',
        ]"
      >
        <span aria-hidden="true" class="flex h-5 w-5 items-center justify-center">
          <svg
            v-if="index < steps.findIndex((x) => x.key === step)"
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span
            v-else-if="step === s.key"
            class="h-2 w-2 animate-pulse rounded-full bg-teal-600 dark:bg-teal-400"
          />
          <span v-else class="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
        </span>
        {{ s.label }}
      </li>
    </ol>
  </div>
</template>
