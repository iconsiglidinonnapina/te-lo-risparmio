<script setup lang="ts">
import type { ProductResponse } from '@/types/analysis';
import StarRating from '@/components/StarRating.vue';

defineProps<{
  product: ProductResponse;
}>();
</script>

<template>
  <article class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row">
      <div
        v-if="product.imageUrl"
        class="flex shrink-0 items-center justify-center sm:h-40 sm:w-40"
      >
        <img
          :src="product.imageUrl"
          :alt="product.title"
          class="max-h-40 w-auto rounded-lg object-contain"
          loading="lazy"
        />
      </div>

      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-semibold text-gray-900 sm:text-xl">
          {{ product.title }}
        </h2>

        <div class="mt-2 flex flex-wrap items-baseline gap-2">
          <span v-if="product.price" class="text-2xl font-bold text-gray-900">
            {{ product.price.displayAmount }}
          </span>
          <span
            v-if="product.listPrice"
            class="text-base text-gray-400 line-through"
            aria-label="`Prezzo di listino: ${product.listPrice.displayAmount}`"
          >
            {{ product.listPrice.displayAmount }}
          </span>
          <span
            v-if="product.savingsPercentage"
            class="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800"
          >
            -{{ product.savingsPercentage }}%
          </span>
        </div>

        <div class="mt-2">
          <StarRating :rating="product.reviewRating" :count="product.reviewCount" />
        </div>

        <div class="mt-4">
          <a
            :href="product.affiliateUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Vedi su Amazon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </a>
          <p class="mt-1 text-xs text-gray-400">(link affiliato)</p>
        </div>
      </div>
    </div>
  </article>
</template>
