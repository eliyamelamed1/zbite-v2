import js from "@eslint/js"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import jsxA11y from "eslint-plugin-jsx-a11y"
import prettier from "eslint-config-prettier"
import globals from "globals"

export default tseslint.config(
  { ignores: ["dist", "*.html", "vite.config.ts", "eslint.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: { version: "18.2" },
    },
    rules: {
      // React
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-no-bind": "off",
      "react/jsx-props-no-spreading": "off",

      // React Refresh
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // TypeScript
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      // Import
      "import/prefer-default-export": "off",
      "import/extensions": "off",
      "import/order": "off",

      // React hooks (from CLAUDE.md)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // Accessibility (from CLAUDE.md)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/interactive-supports-focus": "error",

      // React quality (from CLAUDE.md)
      "react/self-closing-comp": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/no-array-index-key": "warn",
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],

      // General
      "no-console": ["warn", { allow: ["error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "no-empty": "error",
      eqeqeq: ["error", "always"],
    },
  },
  prettier,
)
