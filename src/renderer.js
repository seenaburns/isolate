const electron = require('electron')

const menu = require('./menu')
const scrollbar = require('./scrollbar')
const userData = require('./userData')

const reason = require('./Main.bs')

let global = electron.remote.getGlobal('global')
let root = global.root_dir
let platform = process.platform

let ui = {
  'body': document.querySelector('body'),
}

document.ondragover = (ev) => {
  ev.preventDefault()
}

document.ondrop = document.ondrop = (ev) => {
  ev.preventDefault()

  p = ev.dataTransfer.files[0].path
  root = p
  userData.SetKey("root_dir", root, "settings.json")
  reason.setRoot(p)
}

function copyMenu(menuItem, browserWindow, event) {
  if (reason.isModalOpen()) {
    p = reason.currentImage()
    p = reason.crossPlatform(p)
    p = p.replace('file://', '')
    console.log("copy", p)
    electron.clipboard.writeImage(p)
  }
}

function openLocationMenu(menuItem, browserWindow, event) {
  if (reason.isModalOpen()) {
    p = reason.currentImage()
    p = reason.crossPlatform(p)
    p = p.replace('file://', '')
    console.log("open", p)
    app.showItemInFolder(p)
  }
}

function nightModeMenu(menuItem, browserWindow, event) {
  reason.toggleNightMode()
}

reason.setRoot(root)

nightModeSetting = userData.Get("settings.json")["night_mode"]
nightMode = nightModeSetting != undefined && nightModeSetting
if (nightMode) {
  reason.setNightMode(true)
}

if (platform == 'win32') {
  scrollbar.Init(nightMode)
}

document.querySelector("body").classList.add(platform)

menu.Functions.Copy = copyMenu
menu.Functions.NightMode = nightModeMenu
menu.Functions.OpenLocation = openLocationMenu
menu.Functions.ZoomIn = reason.zoomIn
menu.Functions.ZoomOut = reason.zoomOut
menu.Options.NightMode = reason.nightModeEnabled()
menu.UpdateMenu()

const contextMenu = new electron.remote.Menu()
menu.EditSubMenu().forEach(a => {
  a.enabled = true
  contextMenu.append(new electron.remote.MenuItem(a))
})

window.addEventListener('contextmenu', e => {
  if (reason.isModalOpen()) {
    e.preventDefault()
    contextMenu.popup({window: electron.remote.getCurrentWindow()})
  }
}, false)
