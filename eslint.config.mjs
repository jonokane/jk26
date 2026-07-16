import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /* The jk26-v3 design handoff: HTML prototypes plus the design tool's
       bundled runtime. Reference material, never shipped and never imported
       (its README: "support.js — design-tool runtime only. Do not ship."), so
       linting it only reports on code we do not own and cannot change. */
    "docs/notes/jk26-v3-handoff/**",
  ]),
]);

export default eslintConfig;
