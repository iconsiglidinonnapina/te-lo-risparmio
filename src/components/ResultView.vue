<script setup lang="ts">
import type { ProductResponse, AlternativeProduct, PriceEvaluation } from '@/types/analysis';
import ProductCard from '@/components/ProductCard.vue';
import TrafficLight from '@/components/TrafficLight.vue';
import AlternativesCarousel from '@/components/AlternativesCarousel.vue';

defineProps<{
  product: ProductResponse;
  alternatives: AlternativeProduct[];
  evaluation: PriceEvaluation;
}>();

defineEmits<{
  reset: [];
}>();
</script>

<template>
  <div class="space-y-6 py-8">
    <ProductCard :product="product" />

    <TrafficLight :evaluation="evaluation" />

    <AlternativesCarousel :alternatives="alternatives" />

    <div class="pt-2 text-center">
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-950"
        @click="$emit('reset')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clip-rule="evenodd"
          />
        </svg>
        Nuova ricerca
      </button>
    </div>
  </div>
</template>
