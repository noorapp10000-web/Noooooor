import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
if (rawPort && (Number.isNaN(port) || port <= 0)) throw new Error(`Invalid PORT: "${rawPort}"`);

const basePath = process.env.BASE_PATH ?? "/";
const apiServerPort = process.env.API_SERVER_PORT ?? "3001";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "../..") }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "../../attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase — large, rarely changes
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "vendor-firebase";
          }
          // Framer Motion — animation library
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer";
          }
          // React core
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") ||
              id.includes("node_modules/scheduler")) {
            return "vendor-react";
          }
          // TanStack Query
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-query";
          }
          // Remaining node_modules
          if (id.includes("node_modules")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: `http://localhost:${apiServerPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
