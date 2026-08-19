import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "src-tauri/target/**", "coverage/**"]),
  {
    rules: {
      // Existing client-only hydration and modal synchronization will be
      // replaced incrementally; keep the upgrade from blocking the baseline.
      "react-hooks/set-state-in-effect": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
]);
