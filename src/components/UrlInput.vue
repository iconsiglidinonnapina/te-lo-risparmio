<script setup lang="ts">
import { ref } from 'vue';
import { useUrlValidation } from '@/composables/useUrlValidation';

const emit = defineEmits<{
  submit: [asin: string];
}>();

const { url, result, showError, showSuccess, validate } = useUrlValidation();

const inputRef = ref<HTMLInputElement | null>(null);

function handleSubmit() {
  const validation = validate();
  if (validation.valid && validation.asin) {
    emit('submit', validation.asin);
  } else {
    inputRef.value?.focus();
  }
}
</script>

<template>
  <form class="w-full max-w-2xl mx-auto" novalidate @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <label for="amazon-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Link prodotto Amazon
      </label>

      <div class="flex gap-3">
        <div class="relative flex-1">
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
            class="block w-full rounded-lg border px-4 py-3 text-base outline-none transition-colors focus:ring-2 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500"
            :class="[
              showError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
                : showSuccess
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900'
                  : 'border-gray-300 focus:border-teal-500 focus:ring-teal-200 dark:border-gray-600 dark:focus:border-teal-400 dark:focus:ring-teal-900',
            ]"
          />

          <span
            v-if="showSuccess"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400"
            aria-hidden="true"
          >
            <svg
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
          </span>
        </div>

        <button
          type="submit"
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 dark:bg-teal-500 dark:hover:bg-teal-600 dark:focus:ring-offset-gray-950"
        >
          Analizza
        </button>
      </div>

      <p
        v-if="showError"
        id="url-error"
        class="text-sm text-red-600 dark:text-red-400"
        role="alert"
      >
        {{ result.error }}
      </p>

      <p
        v-else-if="showSuccess"
        id="url-success"
        class="text-sm text-green-700 dark:text-green-400"
      >
        Prodotto trovato: ASIN <strong>{{ result.asin }}</strong>
      </p>

      <p v-else id="url-hint" class="text-sm text-gray-500 dark:text-gray-400">
        Incolla il link di un prodotto Amazon per analizzarne il prezzo
      </p>
    </div>
  </form>
</template>
