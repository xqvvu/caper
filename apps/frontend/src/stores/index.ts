import { createPinia } from "pinia";

export const pinia = createPinia();
export default pinia;

export { useAuthStore } from "@/stores/modules/auth";
