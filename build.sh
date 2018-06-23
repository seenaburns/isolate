#!/usr/bin/env bash

set -euo pipefail

mkdir -p build

# bsb will fail if bsconfig.json not in pwd which is enough for now to check if in top level
# Compile reason
bsb=$(npm bin)/bsb
$bsb -make-world

cat src/style.stylus.css | $(npm bin)/stylus > build/style.css
