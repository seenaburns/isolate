const fs = require("fs");
const nodePath = require("path");
const crypto = require("crypto");

import { Dirent, Stats } from "fs";

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
