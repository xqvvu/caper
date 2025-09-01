import path from "node:path";
import ui from "@nuxt/ui/vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
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
      tailwindcss(),
      ui(),
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
