import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { posthogPlugin } from './plugins/posthog';
import './assets/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(posthogPlugin);
app.mount('#app');
