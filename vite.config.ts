/// <reference types="vitest/config" />
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  css: {
    preprocessorOptions: {
      scss: { quietDeps: true },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "https://exportify.app/" } },
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/setupTests.ts"],
    mockReset: true,
    restoreMocks: true,
    // react-fontawesome's CJS entry would load a second svg-core instance alongside the ESM one icons.ts registers with
    alias: { "@fortawesome/react-fontawesome": "@fortawesome/react-fontawesome/index.es.js" },
  },
})
