import { Database, getDir, File, upsertFile } from "./db";
import { listDir, stat, hash } from "./fs";
import { dimensions } from "./image";

const nodePath = require("path");

export async function updateDirMetadata(
  db: Database,
  path: string
): Promise<void[]> {
  const contents = await listDir(path);
  const dbRecords = await getDir(db, path);

  const files = contents.files.map(f => nodePath.join(path, f));
  const filesInDb = dbRecords.map(f => f.path);

  // Check all files that do not have an existing db record
  const newFiles = files.filter(f => !filesInDb.includes(f));
  const processed: {
    path: string;
    file?: File;
    error?: Error;
  }[] = await Promise.all(
    newFiles.map(f =>
      processFile(f).then(
        (processed: File) => ({
          path: f,
          file: processed
        }),
        error => ({
          path: f,
          error: error
        })
      )
    )
  );

  processed
    .filter(x => x.error)
    .forEach(x => {
      console.log("ERROR updating", x.path, x.error);
    });

  const successful = processed.filter(x => !x.error);
  successful.forEach(x => {
    console.log("Updating", x.path, x.file);
  });

  // TODO: check if file has been modified
  // TODO: check if files no longer exist in dir but do in db (cleanup)
  return Promise.all(successful.map(f => upsertFile(db, f.file)));
}

async function processFile(path: string): Promise<File> {
  const stats = await stat(path);
  const mtime_s = Math.floor(stats.mtime.getTime() / 1000);
  const dim = await dimensions(path);
  const imageHash = await hash(path);

  return {
    hash: imageHash,
    path: path,
    modified: mtime_s,
    width: dim.width,
    height: dim.height
  };
}
