const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const fs = require('fs')
const url = require('url')
const os = require('os')

const userData = require('./userData.js')

let mainWindow
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

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: bg,
    center: true,
    // titleBarStyle: 'hiddenInset',
    // Removes title bar in windows
    frame: false,
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // win.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
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

app.on('ready', init)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
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
