import { defineConfig } from "@eslint/config-helpers";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

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
            "indent": ["error", 4, { SwitchCase: 1 }],
            "semi": ["error", "always"],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": ["warn", { 
                "vars": "all", "varsIgnorePattern": "^_", 
                "args": "after-used", "argsIgnorePattern": "^_" 
            }],
        },
    }
]);