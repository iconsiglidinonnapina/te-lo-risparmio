<script setup lang="ts">
import { ref } from 'vue';
import type { AlternativeProduct } from '@/types/analysis';
import StarRating from '@/components/StarRating.vue';

defineProps<{
  alternatives: AlternativeProduct[];
}>();

const carousel = ref<HTMLElement | null>(null);

function scrollBy(direction: -1 | 1) {
  if (!carousel.value) return;
  const cardWidth = carousel.value.firstElementChild?.clientWidth ?? 240;
  carousel.value.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
}
</script>

<template>
  <section v-if="alternatives.length > 0" aria-labelledby="alternatives-heading">
    <div class="flex items-center justify-between">
      <h3 id="alternatives-heading" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Alternative consigliate
      </h3>
      <div class="hidden gap-1 sm:flex" aria-hidden="true">
        <button
          type="button"
          class="rounded-full border border-gray-300 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-950"
          aria-label="Scorri a sinistra"
          @click="scrollBy(-1)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          class="rounded-full border border-gray-300 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-950"
          aria-label="Scorri a destra"
          @click="scrollBy(1)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      ref="carousel"
      class="carousel mt-4 flex gap-4 overflow-x-auto pb-4"
      role="list"
      tabindex="0"
      aria-label="Prodotti alternativi"
    >
      <article
        v-for="alt in alternatives"
        :key="alt.asin"
        role="listitem"
        class="w-48 shrink-0 snap-start rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-[#141414] sm:w-52"
      >
        <div class="flex h-32 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1a1a1a]">
          <img
            v-if="alt.imageUrl"
            :src="alt.imageUrl"
            :alt="alt.title"
            class="max-h-32 w-auto rounded object-contain"
            loading="lazy"
          />
          <svg
            v-else
            class="h-10 w-10 text-gray-300 dark:text-gray-600"
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

        <h4 class="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ alt.title }}
        </h4>

        <p v-if="alt.price" class="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">
          {{ alt.price.displayAmount }}
        </p>

        <div class="mt-1">
          <StarRating :rating="alt.reviewRating" :count="alt.reviewCount" />
        </div>

        <a
          :href="alt.affiliateUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#FF9900] px-3 py-1.5 text-xs font-medium text-[#111] transition-colors hover:bg-[#E68A00] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
        >
          Vedi su Amazon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3"
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
      </article>
    </div>
  </section>
</template>
