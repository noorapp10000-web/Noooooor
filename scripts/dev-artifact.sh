#!/bin/bash
# Artifact dev script — starts the full Noor app (Vite + API server).
# Replit sets PORT to the artifact's assigned port; Vite listens there.

export BASE_PATH=/

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

VITE_PORT="${PORT:-5000}"
API_SERVER_PORT=3001

echo "Root dir: $ROOT_DIR"
echo "Vite port: $VITE_PORT"
echo "API server port: $API_SERVER_PORT"

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

# Start the API server in the background
echo "Starting API server on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development \
  "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

# Start Vite in the foreground on the artifact's port
echo "Starting Vite dev server on port $VITE_PORT..."
cd "$ROOT_DIR/artifacts/noor" && exec env VITE_PORT=$VITE_PORT PORT=$VITE_PORT API_SERVER_PORT=$API_SERVER_PORT \
  "$ROOT_DIR/artifacts/noor/node_modules/.bin/vite" --config "$ROOT_DIR/artifacts/noor/vite.config.ts"
