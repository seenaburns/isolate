#!/usr/bin/env bash

set -euo pipefail

mkdir -p build

echo "⚡  INSTALLING NATIVE DEPENDENCIES FROM SOURCE"
if [ ! -d "$(npm root)/sqlite3/lib/binding/electron-v4.0-darwin-x64/" ];
then
    echo "⚡  INSTALLING SQLITE3 FROM SOURCE FOR ELECTRON"
    npm install sqlite3 --build-from-source --runtime=electron --target='4.0.0-beta.7' --dist-url=https://atom.io/download/electron
else
    echo "⚡  SQLITE3 ALREADY INSTALLED"
fi

echo "⚡  BUILDING CSS"
cat src/css/main.styl | npx stylus > build/style.css

echo "⚡  RUNNING WEBPACK"
npx webpack