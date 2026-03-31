<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  rating: number | null;
  count: number | null;
}>();

const filledStars = computed(() => (props.rating !== null ? Math.round(props.rating) : 0));

const formattedCount = computed(() => {
  if (props.count === null) return null;
  return props.count.toLocaleString('it-IT');
});

const ariaLabel = computed(() => {
  if (props.rating === null) return 'Nessuna valutazione';
  const base = `${props.rating} stelle su 5`;
  return props.count !== null ? `${base}, ${formattedCount.value} recensioni` : base;
});
</script>

<template>
  <div class="flex items-center gap-1" :aria-label="ariaLabel" role="img">
    <span class="flex" aria-hidden="true">
      <svg
        v-for="i in 5"
        :key="i"
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        :class="i <= filledStars ? 'text-amber-400' : 'text-gray-300'"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </span>
    <span v-if="rating !== null" class="text-sm text-gray-600" aria-hidden="true">
      {{ rating }}
    </span>
    <span v-if="count !== null" class="text-sm text-gray-400" aria-hidden="true">
      ({{ formattedCount }})
    </span>
  </div>
</template>
