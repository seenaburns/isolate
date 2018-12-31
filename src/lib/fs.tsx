const fs = require("fs");
const nodePath = require("path");
const crypto = require("crypto");

import { Image, dimensions } from "./image";
import { Dirent, Stats } from "fs";
import nonFatalAll from "./non-fatal-all";

export interface DirectoryContents {
  dirs: string[];
  files: string[];
}

// List dirs and files under path
// Returns relative paths (only the filename/dirname)
export function list(path: string): Promise<DirectoryContents> {
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

// Given a list of images with partial metadata, fetch the dimensions for any
// images that do not have them. If fetching image dimensions fails, log, but
// skip
export async function fetchDimensionsWhenUnknown(
  partialImages: Partial<Image>[]
): Promise<Image[]> {
  const knownDimensions = partialImages.filter(
    i => i.width && i.height
  ) as Image[];
  const unknownDimensions = partialImages.filter(i => !(i.width && i.height));

  const fetched: Image[] = await nonFatalAll(
    "fetching image dimensions",
    unknownDimensions.map(i =>
      dimensions(i.path).then(dim => ({
        path: i.path,
        width: dim.width,
        height: dim.height
      }))
    )
  );

  return knownDimensions.concat(fetched);
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

// cached version of actual directory walk
let directoryWalkCache: {
  root: string;
  contents: DirectoryContents;
};

export function directoryWalk(root: string): DirectoryContents {
  if (directoryWalkCache && directoryWalkCache.root === root) {
    return directoryWalkCache.contents;
  }

  const contents = recDirectoryWalk(root, 5);
  directoryWalkCache = {
    root: root,
    contents: contents
  };

  return contents;
}

function recDirectoryWalk(
  path: string,
  remainingDepth: number
): DirectoryContents {
  const contents: DirectoryContents = {
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

export async function unsafeMoveAll(paths: string[], dest: string) {
  return nonFatalAll("unsafeMoveAll", paths.map(p => unsafeMove(p, dest)));
}

export async function searchFiles(
  query: string,
  root: string
): Promise<Image[]> {
  const files = directoryWalk(root).files;
  let filtered = files.slice(0, 1000);

  const queries = query.split(" ").filter(q => q !== "");
  if (queries.length !== 0) {
    filtered = files.filter(f =>
      queries.every(query => f.toLowerCase().includes(query.toLowerCase()))
    );
  }

  return nonFatalAll(
    "get dimensions",
    filtered.map(path =>
      dimensions(path).then(({ width, height }) => ({
        path: path,
        width: width,
        height: height
      }))
    )
  );
}
