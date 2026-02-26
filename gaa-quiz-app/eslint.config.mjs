import js from "@eslint/js";
import security from "eslint-plugin-security";

export default [
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
        // Browser globals for public/*.js
        document: "readonly",
        window: "readonly",
        fetch: "readonly",
        alert: "readonly",
        Set: "readonly",
        URL: "readonly",
        localStorage: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off", // noisy for this scan
    },
  },
];
