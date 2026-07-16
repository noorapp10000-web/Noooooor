#!/bin/bash
# Workflow: Start application
# Starts Vite dev server (port 5000) + API server (port 3001)

ARTIFACT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$ARTIFACT_DIR/../.." && pwd)"
TARGET_PORT="${PORT:-5000}"
API_PORT="${API_SERVER_PORT:-3001}"

cleanup() {
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

export BASE_PATH=/

# Start API server
echo "Starting API server on port $API_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_PORT NODE_ENV=development \
  "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

# Start Vite on port 5000
echo "Starting Vite on port $TARGET_PORT..."
cd "$ARTIFACT_DIR" && exec env PORT=$TARGET_PORT API_SERVER_PORT=$API_PORT \
  "$ROOT_DIR/artifacts/noor/node_modules/.bin/vite" --config vite.config.ts
