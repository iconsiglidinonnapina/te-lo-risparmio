import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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

export default router;
