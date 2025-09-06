import type { Result } from "@jigu/shared/@types";
import { ServiceCode } from "@jigu/shared/@types";
import { createFetch } from "@vueuse/core";

const AUTH_WHITE_LIST: string[] = [
  "/auth/sign-in",
];

export const useFetch = createFetch({
  baseUrl: import.meta.env.VITE_API_PREFIX || "/api",
  combination: "chain",
  options: {
    async beforeFetch(ctx) {
      const authStore = useAuthStore();
      const url = new URL(ctx.url, window.location.origin);

      if (!AUTH_WHITE_LIST.includes(url.pathname)) {
        ctx.options.headers = {
          ...ctx.options.headers,
          Authorization: `Bearer ${authStore.token}`,
        };
      }

      return ctx;
    },

    async afterFetch(ctx) {
      if (!ctx.response.ok) {
        throw ctx.response.status;
      }

      const res = ctx.data as Result;
      if (res.code !== ServiceCode.OK) {
        throw res.code;
      }

      ctx.data = res.data;
      return ctx;
    },

    async onFetchError(ctx) {
      if (typeof ctx.error === "number") {
        consola.error(ctx.error);
      }

      return ctx;
    },
  },
});

export default useFetch;
