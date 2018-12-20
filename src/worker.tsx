const electron = require("electron");

import { updateDirMetadata } from "./lib/background-update";
import { openDatabase, Database } from "./lib/db";

console.log("Background worker starting");

let database: Database;

openDatabase().then(
  db => {
    console.log("Initialized db");
    database = db;
  },
  error => {
    console.error("Failed to start database", error);
  }
);

electron.ipcRenderer.on("list", (event: any, path: string) => {
  console.log("Worker got LIST", path);
  if (database) {
    updateDirMetadata(database, path);
  }
});

electron.ipcRenderer.on("channel", (event: any, msg: any) => {
  console.log("Got msg", msg);
});
