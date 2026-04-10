<script setup lang="ts">
import { ref } from 'vue';
import type {
  ProductResponse,
  AlternativeProduct,
  CategorizedAlternatives,
  PriceEvaluation,
} from '@/types/analysis';
import ProductCard from '@/components/ProductCard.vue';
import TrafficLight from '@/components/TrafficLight.vue';
import AlternativesCarousel from '@/components/AlternativesCarousel.vue';
import { useAnalytics } from '@/composables/useAnalytics';

const { trackEvent } = useAnalytics();

defineProps<{
  product: ProductResponse;
  alternatives: AlternativeProduct[];
  categorized: CategorizedAlternatives | null;
  evaluation: PriceEvaluation;
}>();

defineEmits<{
  reset: [];
}>();

const higherExpanded = ref(false);

function toggleHigher() {
  higherExpanded.value = !higherExpanded.value;
  trackEvent('higher_alternatives_toggled', { expanded: higherExpanded.value });
}
</script>

<template>
  <div class="space-y-6 py-8">
    <ProductCard :product="product" />

    <TrafficLight :evaluation="evaluation" />

    <!-- Categorized carousels when tier data is available -->
    <template v-if="categorized">
      <AlternativesCarousel
        v-if="categorized.cheaper.length > 0"
        :alternatives="categorized.cheaper"
        title="Alternative a prezzo inferiore"
        tier="cheaper"
      />

      <AlternativesCarousel
        v-if="categorized.similar.length > 0"
        :alternatives="categorized.similar"
        title="Alternative nella media"
        tier="similar"
      />

      <div v-if="categorized.higher.length > 0" class="space-y-3">
        <button
          type="button"
          :aria-expanded="higherExpanded"
          aria-controls="higher-alternatives"
          class="group inline-flex w-full cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:border-amber-800 dark:hover:bg-amber-950/50 dark:focus:ring-offset-gray-950"
          @click="toggleHigher"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200"
            :class="{ 'rotate-90': higherExpanded }"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="flex-1 text-left">
            {{ categorized.higher.length }}
            {{ categorized.higher.length === 1 ? 'alternativa' : 'alternative' }}
            con prezzo superiore
          </span>
          <span
            class="text-xs text-amber-600 transition-opacity group-hover:opacity-100 dark:text-amber-400"
            :class="higherExpanded ? 'opacity-0' : 'opacity-70'"
          >
            Tocca per espandere
          </span>
        </button>

        <div v-show="higherExpanded" id="higher-alternatives">
          <AlternativesCarousel
            :alternatives="categorized.higher"
            title="Alternative con prezzo superiore"
            tier="higher"
          />
        </div>
      </div>
    </template>

    <!-- Flat fallback when categorized data is unavailable -->
    <AlternativesCarousel v-else :alternatives="alternatives" />

    <div class="pt-2 text-center">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:border-gray-700 dark:bg-[#141414] dark:text-gray-300 dark:hover:bg-[#1a1a1a] dark:focus:ring-offset-gray-950"
        @click="
          trackEvent('new_search_clicked');
          $emit('reset');
        "
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
