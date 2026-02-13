import { defineConfig } from "@eslint/config-helpers";
import tsParser from "@typescript-eslint/parser";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

export default defineConfig([
    {
        ignores: ["**/dist/**", "**/browser/**", "**/node_modules/**"],
    },

    {
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            "simple-import-sort": simpleImportSort,
            "unused-imports": unusedImports,
        },
        rules: {
            "no-restricted-syntax": ["error", {
                selector: "AwaitExpression:not(:function *)",
                message: "Hermes does not support top-level await, and SWC cannot transform it.",
            }],
            "eqeqeq": ["error", "always", { null: "ignore" }],
            "quotes": ["error", "double", { avoidEscape: true }],
            "jsx-quotes": ["error", "prefer-double"],
            "indent": ["error", 4, { SwitchCase: 1 }],
            "semi": ["error", "always"],
            "semi-style": ["error", "last"],
            "no-trailing-spaces": "error",
            "no-multi-spaces": "error",
            "eol-last": ["error", "always"],
            "prefer-const": "error",
            "yoda": "error",
            "spaced-comment": ["error", "always", { markers: ["!"] }],
            "object-curly-spacing": ["error", "always"],

            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "unused-imports/no-unused-imports": "error",
        },
    }
]);