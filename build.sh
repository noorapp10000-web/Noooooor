#!/bin/bash
set -e
pnpm --filter @workspace/noor run build
pnpm --filter @workspace/api-server run build
rm -rf dist/public
mkdir -p dist
cp -R artifacts/noor/dist/public dist/public
