#!/usr/bin/env bash

set -euo pipefail

WEBPACK_DEV_CONFIG="build/webpack.dev.js"
WEBPACK_PROD_CONFIG="build/webpack.prod.js"
WEBPACK_CONFIG="$WEBPACK_DEV_CONFIG"

hashfile="build/out/hash"

while test $# -gt 0; do
    case "$1" in
        -h|--help)
            echo "build.sh - wrapper script for building isolate"
            echo ""
            echo "flags:"
            echo "--prod                    production webpack build (dev is default)"
            echo "--os=OS                   cross compile daemon for another build (accepted: 'linux', 'windows', 'darwin')"
            exit 0
            ;;
        --prod)
            WEBPACK_CONFIG="$WEBPACK_PROD_CONFIG"
            rm "$hashfile"
            shift
            ;;
        --os*)
            export GOOS=`echo $1 | sed -e 's/^[^=]*=//g'`
            shift
            ;;
        *)
            break
            ;;
    esac
done

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

if ! hash go > /dev/null ;
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
if [[ $(cat $hashfile) == $(find src/ -type f -iname '*.tsx' | xargs shasum -a 256) ]];
then
    starting "$step"
    finished "$step (NO CHANGES, SEE $hashfile)"
else
    starting "$step"
    find src/ -type f -iname '*.tsx' | xargs shasum -a 256 > $hashfile
    npx webpack --config "$WEBPACK_CONFIG" --progress
    # Webpack prints a lot so don't bother finishing
fi

