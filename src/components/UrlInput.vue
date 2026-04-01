<script setup lang="ts">
import { ref } from 'vue';
import { useUrlValidation } from '@/composables/useUrlValidation';

const emit = defineEmits<{
  submit: [asin: string, shortLinkUrl?: string];
}>();

const { url, result, isShortLinkUrl, showError, showSuccess, validate } = useUrlValidation();

const inputRef = ref<HTMLInputElement | null>(null);

function handleSubmit() {
  const validation = validate();
  if (validation.valid && validation.asin) {
    emit('submit', validation.asin);
  } else if (validation.valid && !validation.asin && isShortLinkUrl.value) {
    // Short link without extractable ASIN — needs server-side resolution
    emit('submit', '', url.value.trim());
  } else {
    inputRef.value?.focus();
  }
}
</script>

<template>
  <div class="w-full max-w-150 mx-auto">
    <label
      for="amazon-url"
      class="mb-2 block text-center text-sm font-medium text-gray-500 dark:text-gray-400"
    >
      Link prodotto Amazon
    </label>

    <form novalidate @submit.prevent="handleSubmit">
      <div
        class="flex overflow-hidden rounded-xl border-[1.5px] bg-white dark:bg-[#1a1a1a]"
        :class="[
          showError
            ? 'border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
            : showSuccess
              ? 'border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]'
              : 'border-gray-300 focus-within:border-teal-500 focus-within:shadow-[0_0_0_3px_rgba(20,184,166,0.15)] dark:border-[rgba(148,163,184,0.1)]',
        ]"
      >
        <!-- Input -->
        <input
          id="amazon-url"
          ref="inputRef"
          v-model="url"
          type="url"
          inputmode="url"
          autocomplete="url"
          placeholder="https://www.amazon.it/dp/B084K866MQ"
          :aria-invalid="showError ? 'true' : undefined"
          :aria-describedby="showError ? 'url-error' : showSuccess ? 'url-success' : 'url-hint'"
          class="flex-1 border-0 bg-transparent px-4 py-3.5 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        <!-- Submit button -->
        <button
          type="submit"
          class="flex items-center gap-1.5 border-0 bg-teal-500 px-7 text-sm font-semibold text-black transition-colors hover:bg-teal-600 focus:outline-none"
        >
          Analizza
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 7h12M9 3l4 4-4 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <!-- Helper text -->
      <p
        v-if="showError"
        id="url-error"
        class="mt-2 text-center text-xs text-red-600 dark:text-red-400"
        role="alert"
      >
        {{ result.error }}
      </p>

      <p
        v-else-if="showSuccess"
        id="url-success"
        class="mt-2 text-center text-xs text-green-600 dark:text-green-400"
      >
        Prodotto trovato!
      </p>

      <p v-else id="url-hint" class="mt-2.5 text-center text-xs text-gray-500 dark:text-gray-500">
        Incolla il link di un prodotto Amazon per analizzarne il prezzo
      </p>
    </form>
  </div>
</template>
