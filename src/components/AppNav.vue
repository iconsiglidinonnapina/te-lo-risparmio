<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useAnalysisStore } from '@/stores/analysis';

const { isDark, toggle: toggleDark } = useDarkMode();
const route = useRoute();
const router = useRouter();
const store = useAnalysisStore();

const isHomePage = computed(() => route.name === 'home');
const isHowItWorksPage = computed(() => route.name === 'how-it-works');

function goHomeAndReset() {
  store.reset();
  if (route.name !== 'home') {
    void router.push('/');
  }
}
</script>

<template>
  <nav
    class="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 px-3 backdrop-blur-xl sm:px-6 dark:border-[rgba(148,163,184,0.1)] dark:bg-[#0a0a0a]/80"
  >
    <!-- Brand -->
    <button type="button" class="flex shrink-0 items-center gap-2" @click="goHomeAndReset">
      <span class="text-[15px] font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100"
        >Te lo risparmio</span
      >
    </button>

    <!-- Navigation links -->
    <div class="flex shrink-0 items-center gap-1 sm:gap-2">
      <button
        type="button"
        class="rounded-md px-3 py-1.5 text-[13px] transition-all"
        :class="
          isHomePage
            ? 'text-teal-600 dark:text-teal-500'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#141414] dark:hover:text-gray-100'
        "
        @click="goHomeAndReset"
      >
        Home
      </button>
      <router-link
        to="/come-funziona"
        class="rounded-md px-2 py-1.5 text-[13px] whitespace-nowrap transition-all sm:px-3"
        :class="
          isHowItWorksPage
            ? 'text-teal-600 dark:text-teal-500'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#141414] dark:hover:text-gray-100'
        "
      >
        Come funziona
      </router-link>

      <!-- Theme toggle slider -->
      <button
        type="button"
        role="switch"
        :aria-checked="isDark"
        :aria-label="isDark ? 'Attiva modalità chiara' : 'Attiva modalità scura'"
        class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none"
        :class="isDark ? 'bg-teal-500' : 'bg-gray-300'"
        @click="toggleDark"
      >
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full shadow transition-transform"
          :class="isDark ? 'translate-x-5 bg-gray-900' : 'translate-x-0.5 bg-white'"
        >
          <svg
            v-if="isDark"
            class="h-3.5 w-3.5 text-white"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13.5 8.5a5.5 5.5 0 01-6-6 5.5 5.5 0 106 6z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else
            class="h-3.5 w-3.5 text-amber-500"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            v-else class="h-2.5 w-2.5 text-amber-500" viewBox="0 0 16 16" fill="none"
            aria-hidden="true" >
            <path
              d="M8 12a4 4 0 100-8 4 4 0 000 8zM8 1v1M8 14v1M3.05 3.05l.707.707M12.243 12.243l.707.707M1 8h1M14 8h1M3.05 12.95l.707-.707M12.243 3.757l.707-.707"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </span>
      </button>
    </div>
  </nav>
</template>
