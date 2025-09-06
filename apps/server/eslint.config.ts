import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    jsx: false,
    semi: true,
    quotes: "double",
  },
  ignores: [
    "**/jsconfig.*",
    "**/tsconfig.*",
  ],
  rules: {
    "antfu/curly": "off",
    "antfu/if-newline": "off",
  },
});
