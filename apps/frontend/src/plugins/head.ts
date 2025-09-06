import { createHead } from "@unhead/vue/client";

export const head = createHead({
  init: [
    {
      title: "JiGu",
      titleTemplate: "%s | 叽咕",
      htmlAttrs: {
        lang: "zh-CN",
      },
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/vite.svg",
        },
      ],
    },
  ],
});

export default head;
