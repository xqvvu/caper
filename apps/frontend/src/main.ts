import { createApp } from "vue";
import App from "@/app.vue";
import router from "@/router";
import pinia from "@/stores";
import "virtual:uno.css";

createApp(App)
  .use(pinia)
  .use(router)
  .mount("#app");
