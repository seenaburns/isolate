const electron = require("electron");
const path = require("path");
const fs = require("fs");

export default {
  SetKey: SetKey,
  Get: Get
};

// Updates json data at userData/filename with key: value, then writes
function SetKey(key: string, value: any, filename: string) {
  const existing = Get(filename);
  existing[key] = value;
  setRaw(existing, filename);
}

// Overwrites existing json with new json
// Use Set to only update one key
function setRaw(data: string, filename: string) {
  const filepath = userDataPath(filename);
  fs.writeFileSync(filepath, JSON.stringify(data));
}

// Read userData/filename, return {} if path does not exist
function Get(filename: string): any {
  const filepath = userDataPath(filename);
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filepath));
  } catch (error) {
    console.log("Error: failed to read ", filepath, ":", error.message);
  }
  return data;
}

function userDataPath(filename: string): string {
  const dir = (electron.app || electron.remote.app).getPath("userData");
  return path.join(dir, filename);
}
