import path from "node:path";
import ui from "@nuxt/ui/vite";
import tailwindcss from "@tailwindcss/vite";
import { unheadVueComposablesImports } from "@unhead/vue";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";

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
      ui({
        autoImport: {
          imports: [
            "vue",
            "vue-router",
            "vue-i18n",
            "pinia",
            unheadVueComposablesImports,
            {
              consola: ["consola"],
            },
          ],
          dirs: [
            "src/composables",
            "src/stores",
          ],
        },
      }),
      vueDevTools({
        launchEditor: "cursor",
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "#": path.resolve(import.meta.dirname, "locales"),
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
