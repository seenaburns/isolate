const electron = require('electron');
const path = require('path');
const fs = require('fs');

module.exports = {
  SetKey: SetKey,
  Get: Get
}

// Updates json data at userData/filename with key: value, then writes
function SetKey(key, value, filename) {
  existing = Get(filename)
  existing[key] = value
  setRaw(existing, filename)
}

// Overwrites existing json with new json
// Use Set to only update one key
function setRaw(data, filename) {
  filepath = userDataPath(filename)
  fs.writeFileSync(filepath, JSON.stringify(data));
}

// Read userData/filename, return {} if path does not exist
function Get(filename) {
  filepath = userDataPath(filename)
  data = {}
  try {
    data = JSON.parse(fs.readFileSync(filepath))
  } catch(error) {
    console.log("Error: failed to read ", filepath, ":", error.message)
  }
  return data
}

function userDataPath(filename) {
  dir = (electron.app || electron.remote.app).getPath('userData');
  return path.join(dir, filename)
}
