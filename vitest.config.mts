import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const serverOnlyStub = fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    // `server-only` throws unless the bundler picks the RSC condition, which
    // would make server modules untestable.
    alias: { "server-only": serverOnlyStub },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
    // React only ships `act` in its development build. The shell this suite runs
    // from may export NODE_ENV=production, so the test environment pins it here.
    env: { NODE_ENV: "test" },
  },
});
