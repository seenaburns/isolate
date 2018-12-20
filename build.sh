#!/usr/bin/env bash

set -euo pipefail

mkdir -p build

NATIVE_LIBS_MARKER="build/installed-native-libs"

echo "⚡  INSTALLING NATIVE DEPENDENCIES FROM SOURCE"
if [ ! -f $NATIVE_LIBS_MARKER ];
then
    echo "⚡  INSTALLING SQLITE3 FROM SOURCE FOR ELECTRON"
    npm install sqlite3 --build-from-source --runtime=electron --target='4.0.0-beta.7' --dist-url=https://atom.io/download/electron

    echo "⚡  INSTALLING SHARP FROM SOURCE FOR ELECTRON"
    npm install sharp --build-from-source --runtime=electron --target='4.0.0-beta.7'

    touch $NATIVE_LIBS_MARKER
else
    echo "⚡  NATIVE LIBS ALREADY INSTALLED (wipe $NATIVE_LIBS_MARKER to force reinstall)"
fi

echo "⚡  BUILDING CSS"
cat src/css/main.styl | npx stylus > build/style.css

echo "⚡  RUNNING WEBPACK"
npx webpack