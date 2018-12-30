const fs = require("fs");
const nodePath = require("path");
const crypto = require("crypto");

import { Image, dimensions } from "./image";
import { Dirent, Stats } from "fs";

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
