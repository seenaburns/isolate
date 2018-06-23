const electron = require('electron')

const menu = require('./menu')
const scrollbar = require('./scrollbar')
const userData = require('./userData')

const reason = require('./main.bs')

let global = electron.remote.getGlobal('global')
let root = global.root_dir
let platform = process.platform

let ui = {
  'body': document.querySelector('body'),
  'dirs': document.querySelector('#dirs'),
  'images': document.querySelector('#images'),
  'dragndrop': document.querySelector('#dragndrop'),
}

reason.setRoot(root)

document.ondragover = (ev) => {
  ev.preventDefault()
}

document.ondrop = document.body.ondrop = (ev) => {
  ev.preventDefault()

  p = ev.dataTransfer.files[0].path
  root = p
  userData.SetKey("root_dir", root, "settings.json")
  reason.setRoot(p)
}

function copyMenu(menuItem, browserWindow, event) {
  if (reason.isModalOpen()) {
    p = reason.currentImage()
    p = reason.Path$Isolate.crossPlatform(p)
    p = p.replace('file://', '')
    electron.clipboard.writeImage(p)
  }
}

function setNightMode(b) {
  if (b) {
    ui.body.classList.add('nightmode')
  } else {
    ui.body.classList.remove('nightmode')
  }

  if (platform == 'win32') {
    scrollbar.SetNightmode(b)
  }

  menu.Options.NightMode = b
  menu.UpdateMenu()

  userData.SetKey("night_mode", b, "settings.json")
}

function nightModeEnabled() {
  return ui.body.classList.contains('nightmode')
}

function nightModeMenu(menuItem, browserWindow, event) {
  if (document.activeElement == ui.body.search) {
    return
  }
  curr = nightModeEnabled()
  setNightMode(!curr)
}

function openLocationMenu(menuItem, browserWindow, event) {
  if (reason.isModalOpen()) {
    imageUrl = reason.currentImage().replace('file://', '')

    if (platform == 'win32') {
      imageUrl = path.toWindowsPath(imageUrl)
    }

    app.showItemInFolder(imageUrl)
  }
}

nightModeSetting = userData.Get("settings.json")["night_mode"]
nightMode = nightModeSetting != undefined && nightModeSetting
if (nightMode) {
  setNightMode(true)
}

if (platform == 'win32') {
  scrollbar.Init(nightMode)
}

menu.Functions.Copy = copyMenu
menu.Functions.NightMode = nightModeMenu
menu.Functions.OpenLocation = openLocationMenu
menu.Options.NightMode = nightModeEnabled()
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
