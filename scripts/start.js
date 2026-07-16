#!/usr/bin/env node
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

const MAIN_PORT = process.env.PORT || "19382";
const API_DEV_PORT = process.env.API_SERVER_PORT || "3001";
const VITE_PORT = "5000";

console.log(`Starting services: main=${MAIN_PORT} api-dev=${API_DEV_PORT} vite=${VITE_PORT}`);

const processes = [];

function spawnProcess(cmd, args, env = {}, cwd = ROOT_DIR) {
  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  child.on("error", (err) => console.error(`Process error: ${err.message}`));
  processes.push(child);
  return child;
}

// Start dev API server (for live reload)
spawnProcess(
  "pnpm",
  ["exec", "tsx", "./src/index.ts"],
  { PORT: API_DEV_PORT, NODE_ENV: "development" },
  `${ROOT_DIR}/artifacts/api-server`
);

// Start Vite dev server  
spawnProcess(
  "pnpm",
  ["exec", "vite", "--config", `${ROOT_DIR}/vite.config.ts`],
  { PORT: VITE_PORT, BASE_PATH: "/" }
);

// Start production server on main port (serves static + API for workflow detection)
spawnProcess(
  "node",
  [`${ROOT_DIR}/artifacts/api-server/dist/index.cjs`],
  { PORT: MAIN_PORT }
);

function cleanup() {
  console.log("Shutting down all services...");
  processes.forEach((p) => {
    try { p.kill("SIGTERM"); } catch (_) {}
  });
  process.exit(0);
}

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);
process.on("exit", cleanup);
