import type { UseFetchOptions } from "@vueuse/core";
import useFetch from "@/composables/use-fetch";

type UseApiOptions = UseFetchOptions & {
  method?: "get" | "post" | "put" | "delete" | "patch" | "head" | "options";
  fetchOptions?: Omit<RequestInit, "body">;
};

// export function useApi<R = unknown>(
//   url: string,
// ): (useApiOptions?: UseApiOptions) => ReturnType<typeof useFetch<R>>;

// export function useApi<R = unknown, T extends Record<string, any> = object>(
//   url: string,
// ): (body: T, useApiOptions?: UseApiOptions) => ReturnType<typeof useFetch<R>>;

// export function useApi<R = unknown, T extends Record<string, any> = object>(
//   url: string,
// ): (body: T, useApiOptions?: UseApiOptions) => ReturnType<typeof useFetch<R>> {
//   return (body: T, useApiOptions?: UseApiOptions) => {
//     const { fetchOptions = {}, method = "get", ...useFetchOptions } = useApiOptions || {};
//     return useFetch<R>(url, fetchOptions, useFetchOptions)[method](body);
//   };
// };

// export default useApi;

// export function useApi(url: string,)
