#!/usr/bin/env bash

set -euo pipefail

mkdir -p build

echo "⚡  BUILDING CSS"
cat src/css/main.styl | npx stylus > build/style.css

echo "⚡  RUNNING WEBPACK"
npx webpack