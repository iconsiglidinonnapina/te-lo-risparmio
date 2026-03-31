<script setup lang="ts">
import type { LoadingStep } from '@/types/analysis';

defineProps<{
  step: LoadingStep;
}>();

const steps: { key: LoadingStep; label: string }[] = [
  { key: 'fetching-product', label: 'Recupero dati prodotto…' },
  { key: 'fetching-alternatives', label: 'Ricerca alternative…' },
];
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-16" role="status" aria-live="polite">
    <svg
      class="h-12 w-12 animate-spin text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>

    <p class="text-lg font-medium text-gray-700">Analisi in corso</p>

    <ol class="space-y-2">
      <li
        v-for="(s, index) in steps"
        :key="s.key"
        class="flex items-center gap-2 text-sm"
        :class="[
          step === s.key
            ? 'font-medium text-blue-700'
            : index < steps.findIndex((x) => x.key === step)
              ? 'text-green-700'
              : 'text-gray-400',
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
          <span v-else-if="step === s.key" class="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
          <span v-else class="h-2 w-2 rounded-full bg-gray-300" />
        </span>
        {{ s.label }}
      </li>
    </ol>
  </div>
</template>
