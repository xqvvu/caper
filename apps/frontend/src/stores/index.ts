import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

export const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
export default pinia;

export { useAuthStore } from "@/stores/modules/auth";
