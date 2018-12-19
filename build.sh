#!/usr/bin/env bash

set -euo pipefail

mkdir -p build

cat src/css/main.styl | $(npm bin)/stylus > build/style.css
