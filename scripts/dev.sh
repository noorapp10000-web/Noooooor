#!/bin/bash
# Main dev script for the "Start application" workflow.
# On Replit: delegates to replit-dev.sh (artifact-aware multi-proxy setup).
# Outside Replit: starts Vite + API server directly on their default ports.
export BASE_PATH=/

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# On Replit the REPL_ID env var is always set.
# Delegate to the Replit-specific script which starts the noor proxy on 8080,
# Vite on 5000, and the API server on 19382 — matching the artifact router.
if [ -n "$REPL_ID" ]; then
  exec bash "$ROOT_DIR/scripts/replit-dev.sh"
fi

API_SERVER_PORT="${API_SERVER_PORT:-3001}"
VITE_PORT="${PORT:-5000}"

echo "Root dir: $ROOT_DIR"
echo "API server dev port: $API_SERVER_PORT"
echo "Vite port: $VITE_PORT"

TSX_BIN="$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx"
if [ ! -f "$TSX_BIN" ]; then
  TSX_BIN="$ROOT_DIR/node_modules/.bin/tsx"
fi

VITE_BIN="$ROOT_DIR/artifacts/noor/node_modules/.bin/vite"
if [ ! -f "$VITE_BIN" ]; then
  VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"
fi

echo "Using tsx: $TSX_BIN"
echo "Using vite: $VITE_BIN"

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "Starting API server (dev) on port $API_SERVER_PORT..."
(sleep 2 && cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development \
  "$TSX_BIN" ./src/index.ts 2>&1) &

echo "Starting Vite dev server on port $VITE_PORT..."
cd "$ROOT_DIR/artifacts/noor" && export VITE_PORT=$VITE_PORT PORT=$VITE_PORT API_SERVER_PORT=$API_SERVER_PORT && exec "$VITE_BIN" --config "$ROOT_DIR/artifacts/noor/vite.config.ts"
