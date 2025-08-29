import { createFetch } from "@vueuse/core";
import { DOMAIN } from "@/constants/common";
import { useAuthStore } from "@/stores";

const AUTH_WHITE_LIST: string[] = [
  "/auth/sign-in",
];

export const useFetch = createFetch({
  baseUrl: import.meta.env.VITE_API_PREFIX || "/api",
  combination: "chain",
  options: {
    async beforeFetch(ctx) {
      const authStore = useAuthStore();
      const url = new URL(ctx.url, DOMAIN);

      if (!AUTH_WHITE_LIST.includes(url.pathname)) {
        ctx.options.headers = {
          ...ctx.options.headers,
          Authorization: `Bearer ${authStore.token}`,
        };
      }

      return ctx;
    },

    async afterFetch(ctx) {
      return ctx;
    },
  },
});

export default useFetch;
