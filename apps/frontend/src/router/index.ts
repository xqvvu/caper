import { createMemoryHistory, createRouter } from "vue-router";

const routes: Parameters<typeof createRouter>[0]["routes"] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/home/index.vue"),
  },
  {
    path: "/account",
    name: "Account",
    component: () => import("@/views/account/index.vue"),
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
