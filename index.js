const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const fs = require('fs')
const url = require('url')

const db = require('./lib/db')
const path2 = require('./lib/path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
global.global = {
  root_dir: '',
  db: [],
  db_to_path_mapping: {},
  files: [],
}

function error(e) {
  console.error('\x1b[31m%s\x1b[0m', e)
  process.exit(1)
}

function createWindow () {

  // Create the browser window.
  win = new BrowserWindow({width: 1000, height: 600, center: true, titleBarStyle: 'hiddenInset'})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

function init() {
  if (process.argv.length < 3) {
    error("No root_dir given " + process.argv)
  }
  root_dir = process.argv[2]
  global.global.root_dir = root_dir

  // Load db
  dbfile = path2.join(root_dir, 'db.json')
  db.loadDBFromFile(dbfile, dbdata => {
    let files = path2.directoryWalk(root_dir, 5)
    let mapping = db.idToPathMapping(files, dbdata.map(item => item.path))
    global.global.db = dbdata
    global.global.db_to_path_mapping = mapping
    global.global.files = files
  })

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
