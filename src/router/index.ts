import { createRouter, createWebHistory } from 'vue-router';
import posthog from 'posthog-js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
    },
    {
      path: '/come-funziona',
      name: 'how-it-works',
      component: () => import('@/views/HowItWorks.vue'),
    },
  ],
});

router.afterEach((to) => {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture('$pageview', { $current_url: to.fullPath });
  }
});

export default router;
