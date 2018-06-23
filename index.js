const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const fs = require('fs')
const url = require('url')
const os = require('os')

const userData = require('./src/userData')

let win
global.global = {
  root_dir: '',
  files: [],
}

function error(e) {
  console.error('\x1b[31m%s\x1b[0m', e)
  process.exit(1)
}

function createWindow () {
  // Avoid flashing if nightmode is active by reading setting, setting background color before
  // window is even created
  bg = '#ffffff'
  nightModeSetting = userData.Get("settings.json")["night_mode"]
  nightMode = nightModeSetting != undefined && nightModeSetting
  if (nightMode) {
    bg = '#1c1c21'
  }

  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: bg,
    center: true,
    titleBarStyle: 'hiddenInset',
    // Removes title bar in windows
    // frame: false,
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

function init() {
  config = userData.Get("settings.json")
  root_dir = config["root_dir"]
  if (root_dir == undefined) {
    root_dir = ""
  }
  global.global.root_dir = root_dir

  createWindow()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', init)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

const {Menu} = require('electron')
app.inject_menu = function(m) {
  Menu.setApplicationMenu(Menu.buildFromTemplate(m));
}

// Windows will open explorer in the background if showItemInFolder is not executed in the main
// process, so add a simple wrapper on app
app.showItemInFolder = function(path) {
  electron.shell.showItemInFolder(path)
}
