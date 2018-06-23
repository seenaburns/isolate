const electron = require('electron')
const {webFrame} = require('electron')
const fs = require('fs')

const menu = require('./menu')
const scrollbar = require('./scrollbar')
const path = require('./path')
const userData = require('./userData')
const util = require('./util')

const reason = require('./main.bs')

let pwd = ''
let global = electron.remote.getGlobal('global')
let root = global.root_dir
let files = []
let image_list = []
let platform = process.platform

let ui = {
  'body': document.querySelector('body'),
  'dirs': document.querySelector('#dirs'),
  'pwd': document.querySelector('#pwd'),
  'images': document.querySelector('#images'),
  'dragndrop': document.querySelector('#dragndrop'),
}

reason.setRoot(root)

function isImage(f) {
  return ['jpeg', 'jpg', 'png', 'gif', 'svg'].some(ext => f.split('.').pop() == ext)
}

function cd(relpath) {
  if (relpath == '../') {
    pwd = path.up(pwd)
  } else {
    pwd = path.removeLeadingSlash(relpath)
  }
  console.log('cd ' + pwd)
  render()
}

document.ondragover = (ev) => {
  console.log("dragover")
  ev.preventDefault()
}

document.ondrop = document.body.ondrop = (ev) => {
  console.log("ondrop")
  ev.preventDefault()

  p = ev.dataTransfer.files[0].path
  console.log(p)
  root = p
  userData.SetKey("root_dir", root, "settings.json")
  reason.setRoot(p)
}

function copyMenu(menuItem, browserWindow, event) {
  if (reason.isModalOpen()) {
    imageUrl = reason.currentImage().replace('file://', '')

    if (platform == 'win32') {
      imageUrl = path.toWindowsPath(imageUrl)
    }

    electron.clipboard.writeImage(imageUrl)
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

if (root != "") {
  cd('')
} else {
  showDragNDrop()
}
