import path from "node:path";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const {
    API_PROXY_URL,
    PORT: __PORT__,
    VITE_API_PREFIX = "/api",
  } = loadEnv(mode, import.meta.dirname, "");

  const PORT = Number(__PORT__);

  return {
    plugins: [
      vue(),
      UnoCSS({
        mode: "global",
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },

    cacheDir: path.resolve(import.meta.dirname, "../../node_modules/.vite"),

    server: {
      open: true,
      host: true,
      port: Number.isInteger(PORT) ? PORT : 3333,
      proxy: API_PROXY_URL
        ? {
            [VITE_API_PREFIX]: {
              target: API_PROXY_URL,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
