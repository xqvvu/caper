import ui from '@nuxt/ui/vue-plugin';
import { createApp } from 'vue';
import App from '@/app.vue';
import router from '@/router';
import pinia from '@/stores';
import '@/assets/main.css';

createApp(App)
  .use(pinia)
  .use(router)
  .use(ui)
  .mount('#app');
