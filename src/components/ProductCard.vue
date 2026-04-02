<script setup lang="ts">
import type { ProductResponse } from '@/types/analysis';
import StarRating from '@/components/StarRating.vue';

defineProps<{
  product: ProductResponse;
  demo?: boolean;
}>();
</script>

<template>
  <article
    class="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#141414] sm:p-6"
  >
    <div class="flex flex-col gap-4 sm:flex-row">
      <div
        class="flex shrink-0 items-center justify-center self-center rounded-lg bg-gray-100 dark:bg-[#1a1a1a] sm:h-40 sm:w-40"
        :class="product.imageUrl ? '' : 'h-32 w-32 sm:h-40 sm:w-40'"
      >
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.title"
          class="max-h-40 w-auto rounded-lg object-contain"
          loading="lazy"
        />
        <svg
          v-else
          class="h-12 w-12 text-gray-300 dark:text-gray-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
          />
        </svg>
      </div>

      <div class="min-w-0 flex-1">
        <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
          {{ product.title }}
        </h2>

        <div class="mt-2 flex flex-wrap items-baseline gap-2">
          <span v-if="product.price" class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ product.price.displayAmount }}
          </span>
          <span
            v-if="product.listPrice"
            class="text-base text-gray-400 line-through dark:text-gray-500"
            :aria-label="`Prezzo di listino: ${product.listPrice.displayAmount}`"
          >
            {{ product.listPrice.displayAmount }}
          </span>
          <span
            v-if="product.savingsPercentage"
            class="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
          >
            -{{ product.savingsPercentage }}%
          </span>
        </div>

        <div class="mt-2">
          <StarRating :rating="product.reviewRating" :count="product.reviewCount" />
        </div>

        <div class="mt-4">
          <a
            v-if="!demo"
            :href="product.affiliateUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#FF9900] px-4 py-2 text-sm font-medium text-[#111] transition-colors hover:bg-[#E68A00] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
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
          <span
            v-else
            class="inline-flex cursor-default items-center gap-1.5 rounded-lg bg-[#FF9900] px-4 py-2 text-sm font-medium text-[#111]"
            aria-hidden="true"
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
          </span>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">(link affiliato)</p>
        </div>
      </div>
    </div>
  </article>
</template>
