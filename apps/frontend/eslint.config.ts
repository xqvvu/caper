import antfu from "@antfu/eslint-config";
import { eslint } from "@caper/shared/configs";

export default antfu(
  {
    vue: true,
    rules: {
      "vue/multiline-html-element-content-newline": "off",
      "vue/max-attributes-per-line": ["error", { singleline: 3, multiline: 1 }],
    },
  },
  eslint,
);
