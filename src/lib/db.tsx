const sqlite3 = require("sqlite3");

import userData from "./userData";

const DATABASE_FILENAME = "isolate.db";
const SCHEMA = `
CREATE TABLE IF NOT EXISTS files (
    hash TEXT NOT NULL,
    path TEXT NOT NULL,
    modified INTEGER,
    height INTEGER,
    width INTEGER,
    thumbnailPath TEXT,
    PRIMARY KEY (hash, path)
);
`;

export interface Database {
  db: any;
}

export interface File {
  hash: string;
  path: string;
  modified: number;
  width: number;
  height: number;
  thumbnailPath: string;
}

export function openDatabase(): Promise<Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(userData.userDataPath(DATABASE_FILENAME));

    db.run(SCHEMA, [], (error: Error, rows: any) => {
      if (error) {
        reject(error);
      }
      resolve({
        db: db
      });
    });
  });
}

export function upsertFile(db: Database, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    db.db.run(
      `
INSERT INTO files (hash, path, modified, height, width, thumbnailPath)
VALUES(?, ?, ?, ?, ?, ?)
ON CONFLICT (hash, path) DO UPDATE SET
	modified=excluded.modified,
	height=excluded.height,
	width=excluded.width,
    thumbnailPath=excluded.thumbnailPath
`,
      [
        file.hash,
        file.path,
        file.modified,
        file.height,
        file.width,
        file.thumbnailPath
      ],
      (error: Error, rows: any) => {
        if (error) {
          reject(error);
        }
        resolve();
      }
    );
  });
}

export function getDir(db: Database, dir: string): Promise<File[]> {
  return getFiles(db, "path LIKE ? || '%'", [dir]);
}

function getFiles(
  db: Database,
  where: string,
  args: string[]
): Promise<File[]> {
  return new Promise((resolve, reject) => {
    db.db.run(
      `SELECT hash, modified, path, height, width, thumbnailPath FROM files WHERE ${where}`,
      args,
      (error: Error, rows: File[]) => {
        if (error) {
          reject(error);
        }
        resolve(rows);
      }
    );
  });
}
