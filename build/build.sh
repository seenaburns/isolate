#!/usr/bin/env bash

set -euo pipefail

mkdir -p build/out/

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color
OVERWRITE='\e[1A'

starting() {
    echo -e "-  ${NC}$*$NC"
}

finished() {
    echo -en "\e[1A"
    echo -e "⚡  ${GREEN}$*${NC}"
}

if ! command -v go > /dev/null ;
then
    echo -e "${RED}ERROR: golang-go not available, building daemon will fail${NC}\n"
    exit 1
fi

GOVERSION=$(go version)
if [[ "$GOVERSION" != *1.11* ]];
then
    echo -e "${YELLOW}WARNING: golang-go version '${GOVERSION}', only tested with 1.11 ${NC}\n"
fi

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
hashfile="build/out/hash"
if [[ $(cat $hashfile) == $(find src/ -type f -iname '*.tsx' | xargs shasum -a 256) ]];
then
    starting "$step"
    finished "$step (NO CHANGES, SEE $hashfile)"
else
    starting "$step"
    find src/ -type f -iname '*.tsx' | xargs shasum -a 256 > $hashfile
    npx webpack --config build/webpack.config.js --progress
    # Webpack prints a lot so don't bother finishing
fi

