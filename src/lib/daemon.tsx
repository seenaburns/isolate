import { Image } from "./image";

const nodePath = require("path");

export interface Daemon {
  port: number;
}

export default {
  listDir: listDir
};

function listDir(daemon: Daemon, path: string): Promise<Image[]> {
  // TODO: Support windows
  let pathWithoutLeadingSlash = path;
  if (path.startsWith(nodePath.sep)) {
    pathWithoutLeadingSlash = path.substr(1);
  }

  return fetch(
    `http://localhost:${daemon.port}/list/${encodeURI(pathWithoutLeadingSlash)}`
  ).then(
    response => {
      return response.json();
    },
    err => {
      console.error("Error when listing directory in daemon", path, err);
      return [];
    }
  );
}
