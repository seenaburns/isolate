const fs = require("fs");
const nodePath = require("path");
const crypto = require("crypto");

import { Image, dimensions } from "./image";
import { Dirent, Stats } from "fs";
import { isDeepStrictEqual } from "util";

export interface DirectoryContents {
  dirs: string[];
  images: Image[];
}

// TODO: async/await syntax instead of nested promises
// TODO: filter unrecognized extensions to reduce errors
export async function list(path: string): Promise<DirectoryContents> {
  const contents = await listDir(path);
  const files = await nonFatalAll(
    "fetching image dimensions",
    contents.files.map(f => {
      const absPath = nodePath.join(path, f);
      return dimensions(absPath).then(dim => ({
        path: absPath,
        width: dim.width,
        height: dim.height
      }));
    })
  );

  return {
    dirs: contents.dirs,
    images: files
  };
}

async function nonFatalAll<T>(name: string, ps: Promise<T>[]): Promise<T[]> {
  const all = await Promise.all(
    ps.map(p =>
      p.then(
        x => x,
        err => {
          console.error("Failed running", name, err);
          return null;
        }
      )
    )
  );
  return all.filter(x => x);
}

export function listDir(
  path: string
): Promise<{
  dirs: string[];
  files: string[];
}> {
  return new Promise((resolve, reject) => {
    fs.readdir(
      path,
      { withFileTypes: true },
      (err: Error, dirents: Dirent[]) => {
        if (err) {
          reject(err);
        }

        resolve({
          dirs: dirents.filter(x => x.isDirectory()).map(x => x.name),
          files: dirents.filter(x => x.isFile()).map(x => x.name)
        });
      }
    );
  });
}
// Return new path joining currentPath + subdir
// If subdir == "..", return up one level
export function cdPath(currentPath: string, subdir: string): string {
  if (subdir == "..") {
    const split = currentPath.split(nodePath.sep);
    split.pop();
    return split.join(nodePath.sep);
  }

  return nodePath.join(currentPath, subdir);
}

export function stat(path: string): Promise<Stats> {
  return new Promise((resolve, reject) => {
    fs.lstat(path, {}, (error: Error, stats: Stats) => {
      if (error) {
        if (error.message.includes("ENOENT")) {
          resolve(undefined);
        }
        reject(error);
      }
      resolve(stats);
    });
  });
}

export function hash(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = fs.createReadStream(path);
    stream.on("error", (err: Error) => reject(err));
    stream.on("data", (chunk: any) => hash.update(chunk));
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

// cached version of actual directory walk
interface DirectoryWalkContents {
  dirs: string[];
  files: string[];
}
let directoryWalkCache: DirectoryWalkContents;

export function directoryWalk(path: string): DirectoryWalkContents {
  if (directoryWalkCache) {
    return directoryWalkCache;
  }

  directoryWalkCache = recDirectoryWalk(path, 5);
  return directoryWalkCache;
}

function recDirectoryWalk(
  path: string,
  remainingDepth: number
): DirectoryWalkContents {
  const contents: DirectoryWalkContents = {
    dirs: [],
    files: []
  };

  if (remainingDepth <= 0) {
    return contents;
  }

  const dirents: Dirent[] = fs.readdirSync(path, { withFileTypes: true });
  dirents.forEach(f => {
    const absPath = nodePath.join(path, f.name);
    if (f.isDirectory()) {
      contents.dirs.push(absPath + "/");
      const rest = recDirectoryWalk(absPath, remainingDepth - 1);
      contents.dirs = contents.dirs.concat(rest.dirs);
      contents.files = contents.files.concat(rest.files);
    } else {
      contents.files.push(absPath);
    }
  });

  return contents;
}

// Display an absolute path relative to root
// e.g. trimRelativeToRoot("/a/b/c", "/a") => /b/c
export function trimRelativeToRoot(path: string, root: string) {
  let trimmed = path.replace(root, "");
  if (trimmed.length === 0 || trimmed[0] != "/") {
    trimmed = "/" + trimmed;
  }
  return trimmed;
}

export async function unsafeMove(path: string, dest: string) {
  console.log("Move", path, dest);

  // Check target directory exists
  const destStat = await stat(dest);
  if (!destStat.isDirectory()) {
    console.warn("Destination is not a directory, skipping move");
    return;
  }

  // Check not overwrite existing file
  const basename = nodePath.basename(path);
  const destFile = nodePath.join(dest, basename);
  const destFileStat = await stat(destFile);
  if (destFileStat) {
    console.warn(`Destination path ${destFile} exists, skipping move`);
    return;
  }

  return new Promise((resolve, reject) => {
    fs.rename(path, destFile, (error: Error) => {
      if (error) {
        reject(error);
      }
      resolve(null);
    });
  });
}
