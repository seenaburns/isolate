#!/usr/bin/env bash

set -euo pipefail

mkdir -p build/out/

GREEN='\033[0;32m'
NC='\033[0m' # No Color
OVERWRITE='\e[1A'

starting() {
    echo -e "-  ${NC}$*$NC"
}

finished() {
    echo -en "\e[1A"
    echo -e "⚡  ${GREEN}$*${NC}"
}

step="BUILDING GO DAEMON (ISOLATED)"
starting "$step"
(
    cd src/isolated/
    go build -o ../../build/out/isolated
)
finished "$step"

step="BUILDING CSS"
starting "$step"
cat src/css/main.styl | npx stylus > build/out/style.css
finished "$step"

step="BUILDING WEBPACK"
starting "$step"
npx webpack --config build/webpack.config.js
# Webpack prints a lot so don't bother finishing