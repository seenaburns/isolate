import { Image } from "./image";

const nodePath = require("path");

export interface DaemonConfig {
  port: number;
}

export default {
  listDir: listDir
};

function listDir(daemon: DaemonConfig, path: string): Promise<Image[]> {
  // TODO: Support windows
  let pathWithoutLeadingSlash = path;
  if (path.startsWith(nodePath.sep)) {
    pathWithoutLeadingSlash = path.substr(1);
  }

  return fetch(
    `http://localhost:${daemon.port}/list/${encodeURI(
      pathWithoutLeadingSlash
    )}`,
    {
      // Disable cache otherwise electron/chrome will indefinitely save responses on disk
      cache: "no-store"
    }
  )
    .then(response => {
      return response.json();
    })
    .then(json => json.images)
    .catch(err => {
      console.error("Error when listing directory in daemon", path, err);
      return [];
    });
}
