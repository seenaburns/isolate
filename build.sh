#!/usr/bin/env bash

set -euo pipefail

mkdir -p build

cat src/css/main.styl | $(npm bin)/stylus > build/style.css

# bsb will fail if bsconfig.json not in pwd which is enough for now to check if in top level
# Compile reason
bsb=$(npm bin)/bsb
$bsb -make-world

# Extract minimum necessary components from reason-react and bs-platform
# Why?
#  The runtime libraries for bs-platform are not exposed as a separate module. This extracts them
#  and replaces the references with a relative reference. Repeat for reason-react
# Why though?
#  Windows startup times seem to be absymal, my guess is because of a giant asar.unpacked it creates
#  on every app start, including all 300mb of bs-platform.

# Replace require(...) with reference to local module
replace_deps() {
  sed -i '' "s|require(\"$1|require(\"$2|g" $3;
}

if [ ! -d build/bs-stdlib ];
then
  mkdir -p build/bs-stdlib/lib/js
  cp -r node_modules/bs-platform/lib/js/* build/bs-stdlib/lib/js/
fi

if [ ! -d build/reason-react ];
then
  mkdir -p build/reason-react/src/
  cp -r node_modules/reason-react/src/*.js build/reason-react/src/

  for f in $(find build/reason-react -iname '*.js');
  do
    replace_deps "bs-platform" "../../../build/bs-stdlib" $f
  done
fi

for f in $(find src -iname '*.bs.js');
do
  replace_deps "bs-platform" "../build/bs-stdlib" $f
  replace_deps "reason-react" "../build/reason-react" $f
done
