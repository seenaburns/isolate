const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const fs = require("fs");
const net = require("net");
const url = require("url");
const { spawn } = require("child_process");

import userData, { THUMBNAIL_DIR } from "./lib/userData";
import { Daemon } from "./lib/daemon";

let globalData: any = global;
globalData.global = {
  root_dir: "",
  files: []
};

let mainWindow: any;

let daemonProcess: any;
let lastStderr: string;
let shuttingDown = false;

function createWindow(): Promise<void> {
  // Avoid flashing if nightmode is active by reading setting, setting background color before
  // window is even created
  let bg = "#ffffff";
  const nightModeSetting = userData.Get("settings.json")["night_mode"];
  const nightMode = nightModeSetting != undefined && nightModeSetting;
  if (nightMode) {
    bg = "#1c1c21";
  }

  const thumbnailDir = userData.userDataPath(THUMBNAIL_DIR);
  if (!fs.existsSync(thumbnailDir)) {
    const err = fs.mkdirSync(thumbnailDir);
    if (err) {
      console.error("Failed to create thumbnail dir", thumbnailDir);
    }
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
      pathname: path.join(__dirname, "..", "..", "src", "index.html"),
      protocol: "file:",
      slashes: true
    })
  );

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function() {
    mainWindow = null;
  });

  return new Promise((resolve, reject) => {
    mainWindow.webContents.on("did-finish-load", () => {
      console.log("Init: main window loaded");
      resolve();
    });
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

  createWindow()
    .then(getAvailablePort)
    .then(spawnDaemon)
    .then(daemonConfig =>
      mainWindow.webContents.send("daemon-did-init", daemonConfig)
    )
    .catch(err => {
      console.log("Initialization failed:", err);
    });
}

app.on("ready", init);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  if (!mainWindow) {
    createWindow();
  }
});

app.on("quit", killDaemon);

const { Menu } = require("electron");
app.inject_menu = function(m: any) {
  Menu.setApplicationMenu(Menu.buildFromTemplate(m));
};

// Windows will open explorer in the background if showItemInFolder is not executed in the main
// process, so add a simple wrapper on app
app.showItemInFolder = function(path: string) {
  electron.shell.showItemInFolder(path);
};

// Asynchronously spawn daemon, resolve promise once finished initializing
function spawnDaemon(port: number): Promise<Daemon> {
  return new Promise((resolve, reject) => {
    console.log("Init: spawning daemon");
    let initialized = false;

    const userDataPath = app.getPath("userData");
    if (userDataPath == "") {
      reject(new Error("UserDataPath empty"));
      return;
    }

    daemonProcess = spawn(path.join(__dirname, "isolated"), [
      "-appdir",
      userDataPath,
      "-port",
      port
    ]);

    daemonProcess.stdout.on("data", (data: string) => {
      if (!initialized) {
        initialized = true;
        console.log("Init: spawned daemon");
        resolve({ port: port });
      }
      console.log(`daemon stdout: ${data}`);
    });

    daemonProcess.stderr.on("data", (data: string) => {
      lastStderr = `${data}`;
      console.log(`daemon stderr: ${data}`);
    });

    daemonProcess.on("close", (code: number | null) => {
      if (code || !shuttingDown) {
        throw new Error(
          `Daemon unexpectedly exited\nLast log line: "${lastStderr}"`
        );
      }
      console.log(`daemon exited with code ${code}`);
    });
  });
}

function killDaemon() {
  shuttingDown = true;
  if (daemonProcess) {
    daemonProcess.kill();
    console.log("Daemon killed status: ", daemonProcess.killed);
  }
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0);
    server.on("listening", function() {
      const port = server.address().port;
      server.close();
      resolve(port);
    });
  });
}
