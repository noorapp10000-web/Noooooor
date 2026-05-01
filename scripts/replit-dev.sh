#!/bin/bash
# Dev startup script for Replit.
#
# pid1 reads [[artifacts]] in .replit and starts its own artifact router on
# port 18080. That router reads artifact.toml files:
#   - artifacts/noor:       routes "/" → port 8080 (dev proxy → Vite port 5000)
#   - artifacts/api-server: routes "/api-server/" → port 19382
#
# We start:
#   1. API server on port 19382 (directly)
#   2. Vite dev server on port 5000
#   3. Noor dev proxy on port 8080 → forwards to Vite on port 5000
#      (this is what the artifact router's noor service expects)
#
# waitForPort = 5000 in the workflow waits for Vite to be ready.

export BASE_PATH=/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VITE_PORT=5000
API_SERVER_PORT=19382
NOOR_PROXY_PORT=8080

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "Starting API server on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && \
  PORT=$API_SERVER_PORT NODE_ENV=development \
  "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

echo "Starting noor proxy on port $NOOR_PROXY_PORT -> Vite on port $VITE_PORT..."
PROXY_PORT=$NOOR_PROXY_PORT TARGET_PORT=$VITE_PORT node "$ROOT_DIR/scripts/proxy.js" &

echo "Starting Vite dev server on port $VITE_PORT..."
cd "$ROOT_DIR/artifacts/noor" && exec env \
  PORT=$VITE_PORT \
  VITE_PORT=$VITE_PORT \
  API_SERVER_PORT=$API_SERVER_PORT \
  BASE_PATH=/ \
  "$ROOT_DIR/artifacts/noor/node_modules/.bin/vite" \
  --config "$ROOT_DIR/artifacts/noor/vite.config.ts"
