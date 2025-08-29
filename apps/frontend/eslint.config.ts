import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    jsx: false,
    semi: true,
    quotes: "double",
  },
  vue: true,
  unocss: true,
  rules: {
    // "vue/max-attributes-per-line": ["error", { singleline: 3, multiline: 1 }],
  },
  ignores: ["tsconfig.app.json", "tsconfig.json", "tsconfig.node.json"],
});
