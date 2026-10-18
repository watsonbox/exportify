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
      // Bootstrap 5 only supports being loaded with @import, and its own SCSS uses deprecated Sass features
      scss: { quietDeps: true, silenceDeprecations: ["import"] },
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
  },
})
