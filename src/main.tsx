const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const fs = require("fs");
const url = require("url");
const os = require("os");

import userData from "./lib/userData";

let globalData: any = global;

let mainWindow: any;
globalData.global = {
  root_dir: "",
  files: []
};

function error(e: string) {
  console.error("\x1b[31m%s\x1b[0m", e);
  process.exit(1);
}

function createWindow() {
  // Avoid flashing if nightmode is active by reading setting, setting background color before
  // window is even created
  let bg = "#ffffff";
  const nightModeSetting = userData.Get("settings.json")["night_mode"];
  const nightMode = nightModeSetting != undefined && nightModeSetting;
  if (nightMode) {
    bg = "#1c1c21";
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: bg,
    center: true,
    // titleBarStyle: 'hiddenInset',
    // Removes title bar in windows
    frame: false
  });

  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "..", "src", "index.html"),
      protocol: "file:",
      slashes: true
    })
  );

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function() {
    mainWindow = null;
  });
}

function init() {
  const config = userData.Get("settings.json");
  let root_dir = config["root_dir"];
  if (root_dir == undefined) {
    root_dir = "";
  }
  globalData.global.root_dir = root_dir;
  globalData.global.night_mode = config["night_mode"] || false;

  createWindow();
}

app.on("ready", init);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  if (mainWindow === null) {
    createWindow();
  }
});

const { Menu } = require("electron");
app.inject_menu = function(m: any) {
  Menu.setApplicationMenu(Menu.buildFromTemplate(m));
};

// Windows will open explorer in the background if showItemInFolder is not executed in the main
// process, so add a simple wrapper on app
app.showItemInFolder = function(path: string) {
  electron.shell.showItemInFolder(path);
};
