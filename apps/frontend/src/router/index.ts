import { createMemoryHistory, createRouter } from "vue-router";

type TRoutes = Parameters<typeof createRouter>[0]["routes"];

const routes: TRoutes = [
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
