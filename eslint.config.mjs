import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add custom rules as a separate object
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn", // change from 'error' to 'warn'
    },
  },
];

export default eslintConfig;
