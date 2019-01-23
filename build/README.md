# Building Isolate

I recommend using [the prebuilt application releases](https://github.com/seenaburns/isolate/releases), but here's how to build from source.

Isolate consists of a UI, built in Typescript on top of Electron, and a backend daemon (go) for
heavy lifting. Isolate can fully function without the daemon, which may be easier for Windows.

In addition to the npm dependencies, Isolate's daemon requires:

- go (v1.11 or higher)
- gcc (the daemon uses mattn/sqlite3, a cgo module)

#### OSX / Linux

For osx/linux, you can build from source by first cloning and then running `npm install . && npm run start`. This internally calls [build.sh](build/build.sh) which encodes the build process.

`npm run dist-osx`, `npm run dist-linux` will build and package the application locally, which is
what the releases page uses.

#### Windows

On Windows, this process is less polished.

Because installing gcc on Windows is a process in itself, I've used the Windows Subsystem for Linux
(WSL) to cross compile the daemon, using `mingw-w64`, and `build.sh` assumes this is how you are
building it on Windows.

From WSL, I use [build.sh](build/build.sh) to cross compile the daemon (with `go` and `mingw-w64` installed)
and compile/package the typescript with webpack.

Afterwards, from a console in Windows land `npx electron .` will run the application, or `npx electron-builder --config build\build.json` will package it.