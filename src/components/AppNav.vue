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
    class="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-3 backdrop-blur-xl sm:px-6 dark:border-[rgba(148,163,184,0.1)] dark:bg-[#0a0a0a]/80"
  >
    <!-- Brand -->
    <button type="button" class="relative flex shrink-0 items-center" @click="goHomeAndReset">
      <img
        src="@/assets/images/title_logo_black.svg"
        alt="te lo risparmio"
        class="h-3 w-auto sm:h-6"
        :style="{
          opacity: isDark ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }"
      />
      <img
        src="@/assets/images/title_logo_white.svg"
        alt=""
        aria-hidden="true"
        class="absolute left-0 top-1/2 h-3 w-auto -translate-y-1/2 sm:h-6"
        :style="{
          opacity: isDark ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }"
      />
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
        class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent focus:outline-none"
        :style="{
          backgroundColor: isDark ? '#14b8a6' : '#d1d5db',
          transition: 'background-color 0.4s ease',
        }"
        @click="toggleDark"
      >
        <span
          class="pointer-events-none relative inline-flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-md"
          :style="{
            transform: isDark ? 'translateX(22px)' : 'translateX(1px)',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease',
          }"
        >
          <Transition name="toggle-icon" mode="out-in">
            <svg
              v-if="isDark"
              key="moon"
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
              key="sun"
              class="h-3.5 w-3.5 text-amber-500"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 12a4 4 0 100-8 4 4 0 000 8zM8 1v1M8 14v1M3.05 3.05l.707.707M12.243 12.243l.707.707M1 8h1M14 8h1M3.05 12.95l.707-.707M12.243 3.757l.707-.707"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </Transition>
        </span>
      </button>
    </div>
  </nav>
</template>
