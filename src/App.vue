<script setup lang="ts">
import AppNav from '@/components/AppNav.vue';
import AppFooter from '@/components/AppFooter.vue';
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100"
  >
    <!-- Skip link -->
    <a
      href="#maincontent"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-teal-700 focus:shadow-md"
    >
      Vai al contenuto principale
    </a>

    <!-- Nav -->
    <AppNav />

    <!-- Router view -->
    <router-view />

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
