const fs = require("fs");
const nodePath = require("path");

import { Image, imageInfo } from "./image";
import { Dirent } from "fs";

export interface DirectoryContents {
  dirs: string[];
  images: Image[];
}

// TODO: async/await syntax instead of nested promises
// TODO: filter unrecognized extensions to reduce errors
export function list(path: string): Promise<DirectoryContents> {
  return listDir(path).then(entries => {
    return Promise.all(
      entries.files.map(x => {
        const absPath = nodePath.join(path, x);
        return imageInfo(absPath).then(({ image, error }) => {
          if (error) {
            console.log(error);
            return null;
          }
          return image;
        });
      })
    )
      .then((results: Image[]) => results.filter((x: Image) => x))
      .then(images => ({
        dirs: [".."].concat(entries.dirs),
        images: images
      }));
  });
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
