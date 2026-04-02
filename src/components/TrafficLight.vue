<script setup lang="ts">
import { computed } from 'vue';
import type { PriceEvaluation } from '@/types/analysis';

const props = defineProps<{
  evaluation: PriceEvaluation;
}>();

const borderColor = computed(() => {
  const map = {
    green: 'border-green-400 dark:border-green-600',
    yellow: 'border-amber-400 dark:border-amber-600',
    red: 'border-red-400 dark:border-red-600',
  } as const;
  return map[props.evaluation.color];
});

const bgColor = computed(() => {
  const map = {
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-amber-50 dark:bg-amber-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
  } as const;
  return map[props.evaluation.color];
});

const labelColor = computed(() => {
  const map = {
    green: 'text-green-800 dark:text-green-400',
    yellow: 'text-amber-800 dark:text-amber-400',
    red: 'text-red-800 dark:text-red-400',
  } as const;
  return map[props.evaluation.color];
});

// Calculate percentage width for price bars
const barWidths = computed(() => {
  const bars = props.evaluation.priceBars;
  if (!bars || !bars.currentPrice) return null;

  const prices = [
    bars.currentPrice.amount,
    bars.averageAlternativePrice?.amount ?? 0,
    bars.cheapestAlternativePrice?.amount ?? 0,
  ].filter((p) => p > 0);

  const maxPrice = Math.max(...prices);

  return {
    current: (bars.currentPrice.amount / maxPrice) * 100,
    average: bars.averageAlternativePrice
      ? (bars.averageAlternativePrice.amount / maxPrice) * 100
      : null,
    cheapest: bars.cheapestAlternativePrice
      ? (bars.cheapestAlternativePrice.amount / maxPrice) * 100
      : null,
  };
});

const hasPriceBars = computed(() => {
  return (
    props.evaluation.priceBars?.currentPrice &&
    (props.evaluation.priceBars?.averageAlternativePrice ||
      props.evaluation.priceBars?.cheapestAlternativePrice)
  );
});

const explanationParts = computed(() => {
  return props.evaluation.explanation.split('. ').filter(Boolean);
});

// Determine dynamic bar colors based on price values
const barColors = computed(() => {
  const bars = props.evaluation.priceBars;
  if (!bars || !bars.currentPrice) return null;

  const priceMap = [
    { key: 'current', amount: bars.currentPrice.amount },
    { key: 'average', amount: bars.averageAlternativePrice?.amount ?? 0 },
    { key: 'cheapest', amount: bars.cheapestAlternativePrice?.amount ?? 0 },
  ].filter((p) => p.amount > 0);

  // Sort by amount descending
  const sorted = [...priceMap].sort((a, b) => b.amount - a.amount);

  const colors: Record<string, string> = {};
  sorted.forEach((item, index) => {
    if (sorted.length === 1) {
      colors[item.key] = 'green';
    } else if (sorted.length === 2) {
      colors[item.key] = index === 0 ? 'red' : 'green';
    } else {
      // 3 items: highest=red, middle=amber, lowest=green
      colors[item.key] = index === 0 ? 'red' : index === 1 ? 'amber' : 'green';
    }
  });

  return colors;
});
</script>

<template>
  <section
    :class="[bgColor, borderColor]"
    class="rounded-xl border-2 p-4 sm:p-6"
    aria-labelledby="traffic-light-label"
  >
    <div class="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
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
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
          <li v-for="(part, idx) in explanationParts" :key="idx">
            {{ part.endsWith('.') ? part : `${part}.` }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Comparative price bars -->
    <div v-if="hasPriceBars" class="mt-6 space-y-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Confronto prezzi</h3>

      <!-- Current price -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-600 dark:text-gray-400">Questo prodotto</span>
          <span class="font-semibold text-gray-900 dark:text-gray-100">
            {{ evaluation.priceBars!.currentPrice!.displayAmount }}
          </span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="{
              'bg-red-500 dark:bg-red-600': barColors?.current === 'red',
              'bg-amber-500 dark:bg-amber-600': barColors?.current === 'amber',
              'bg-green-500 dark:bg-green-600': barColors?.current === 'green',
            }"
            :style="{ width: `${barWidths!.current}%` }"
            role="img"
            :aria-label="`Prezzo corrente: ${evaluation.priceBars!.currentPrice!.displayAmount}`"
          />
        </div>
      </div>

      <!-- Alternatives average -->
      <div v-if="evaluation.priceBars?.averageAlternativePrice" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-600 dark:text-gray-400">Media alternative</span>
          <span class="font-semibold text-gray-900 dark:text-gray-100">
            {{ evaluation.priceBars.averageAlternativePrice.displayAmount }}
          </span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="{
              'bg-red-500 dark:bg-red-600': barColors?.average === 'red',
              'bg-amber-500 dark:bg-amber-600': barColors?.average === 'amber',
              'bg-green-500 dark:bg-green-600': barColors?.average === 'green',
            }"
            :style="{ width: `${barWidths!.average}%` }"
            role="img"
            :aria-label="`Media prezzi alternative: ${evaluation.priceBars.averageAlternativePrice.displayAmount}`"
          />
        </div>
      </div>

      <!-- Cheapest alternative -->
      <div v-if="evaluation.priceBars?.cheapestAlternativePrice" class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-600 dark:text-gray-400"
            >Alternativa più economica</span
          >
          <span class="font-semibold text-gray-900 dark:text-gray-100">
            {{ evaluation.priceBars.cheapestAlternativePrice.displayAmount }}
          </span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="{
              'bg-red-500 dark:bg-red-600': barColors?.cheapest === 'red',
              'bg-amber-500 dark:bg-amber-600': barColors?.cheapest === 'amber',
              'bg-green-500 dark:bg-green-600': barColors?.cheapest === 'green',
            }"
            :style="{ width: `${barWidths!.cheapest}%` }"
            role="img"
            :aria-label="`Prezzo più basso trovato: ${evaluation.priceBars.cheapestAlternativePrice.displayAmount}`"
          />
        </div>
      </div>
    </div>
  </section>
</template>
