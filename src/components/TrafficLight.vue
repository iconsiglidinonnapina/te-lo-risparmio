<script setup lang="ts">
import { computed } from 'vue';
import type { PriceEvaluation } from '@/types/analysis';

const props = defineProps<{
  evaluation: PriceEvaluation;
}>();

const borderColor = computed(() => {
  const map = {
    green: 'border-green-400',
    yellow: 'border-amber-400',
    red: 'border-red-400',
  } as const;
  return map[props.evaluation.color];
});

const bgColor = computed(() => {
  const map = {
    green: 'bg-green-50',
    yellow: 'bg-amber-50',
    red: 'bg-red-50',
  } as const;
  return map[props.evaluation.color];
});

const labelColor = computed(() => {
  const map = {
    green: 'text-green-800',
    yellow: 'text-amber-800',
    red: 'text-red-800',
  } as const;
  return map[props.evaluation.color];
});
</script>

<template>
  <section
    :class="[bgColor, borderColor]"
    class="rounded-xl border-2 p-4 sm:p-6"
    aria-labelledby="traffic-light-label"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex shrink-0 gap-1.5 rounded-full bg-gray-800 px-2 py-1.5"
        role="img"
        :aria-label="`Semaforo: ${evaluation.label}`"
      >
        <span
          class="block h-5 w-5 rounded-full border-2"
          :class="
            evaluation.color === 'red'
              ? 'border-red-400 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
              : 'border-gray-600 bg-gray-700'
          "
        />
        <span
          class="block h-5 w-5 rounded-full border-2"
          :class="
            evaluation.color === 'yellow'
              ? 'border-amber-400 bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
              : 'border-gray-600 bg-gray-700'
          "
        />
        <span
          class="block h-5 w-5 rounded-full border-2"
          :class="
            evaluation.color === 'green'
              ? 'border-green-400 bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
              : 'border-gray-600 bg-gray-700'
          "
        />
      </div>

      <div class="min-w-0 flex-1">
        <p id="traffic-light-label" class="text-lg font-bold uppercase" :class="labelColor">
          {{ evaluation.label }}
        </p>
        <p class="mt-1 text-sm text-gray-700">{{ evaluation.explanation }}</p>
      </div>
    </div>
  </section>
</template>
