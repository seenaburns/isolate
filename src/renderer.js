const electron = require('electron')
const {webFrame} = require('electron')
const fs = require('fs')

const menu = require('./menu')
const modal = require('./modal')
const path = require('./path')
const userData = require('./userData')
const util = require('./util')

let pwd = ''
let global = electron.remote.getGlobal('global')
let root = global.root_dir
let files = []
let image_list = []

let ui = {
  'dirs': document.querySelector('#dirs'),
  'pwd': document.querySelector('#pwd'),
  'images': document.querySelector('#images'),
  'search': document.querySelector('#search'),
  'dragndrop': document.querySelector('#dragndrop'),
}

function isImage(f) {
  return ['jpeg', 'jpg', 'png', 'gif', 'svg'].some(ext => f.split('.').pop() == ext)
}

function setDirsNav(dirs) {
  let renderDir = function (d, path) {
    let l = document.createElement('li')
    let a = util.link('#', d)
    a.setAttribute('path', path)
    l.appendChild(a)
    return l
  }

  let dirs_container = document.querySelector('#dirs ul')
  dirs_container.innerHTML = ""
  if (pwd != '') {
    dirs_container.appendChild(renderDir('../', '../'))
  }
  dirs.forEach(d => {
    dirs_container.appendChild(renderDir(d, d))
  })

  document.querySelectorAll('#dirs a').forEach(a => {
    a.onclick = e => cd(a.getAttribute('path'))
  })
}

function setPwd(path, image_count) {
  ui.pwd.innerHTML = '/' + pwd + ' (' + image_count + ')'
}

function imgUrl(relpath) {
  return 'file://' + path.join(root, relpath)
}

function setImages(images) {
  let renderImage = function(relpath) {
    let iw = document.createElement('div')
    iw.className = "iw"
    let i = document.createElement('img')
    i.onclick = e => {
      modal.setModal(e.toElement.src, relpath)
      modal.openModal()
    }
    i.src = imgUrl(relpath)
    iw.appendChild(i)
    return iw
  }

  image_list = images.map(x => imgUrl(x))
  ui.images.innerHTML = ""
  images.forEach(i => {
    ui.images.appendChild(renderImage(i))
  })
}

function hide(elem) {
  elem.style.display = 'none'
}

function show(elem) {
  elem.style.display = 'block'
}

function showDragNDrop() {
  hide(ui['search'])
  show(ui['dragndrop'])
}

function hideDragNDrop() {
  show(ui['search'])
  hide(ui['dragndrop'])
}

function render() {
  let files = fs.readdirSync(path.join(root,pwd)).map(f => path.join(pwd, f))
  let images = files.filter(f => isImage(f) && path.isFile(path.join(root, f)))
  setPwd(pwd, images.length)
  setDirsNav(files.filter(f => path.isDir(path.join(root, f))))
  setImages(images)
}

function loadFiles() {
  return path.directoryWalk(root, 5)
}

function clearWebframeCache() {
  // Chromium seems to hold a copy of every image in the webframe cache. This can cause the memory
  // used to balloon, looking alarming to users.
  // webFrame.clearCache() unloads these images, dropping memory at the cost of directory load time.
  webFrame.clearCache()
}

function search(term) {
  console.log("Search: " + term)

  if (files.length == 0) {
   files = loadFiles()
  }

  let results = files
    .filter(x => x.includes(term))
    .filter(isImage)
  console.log(results)
  setImages(results.map(x => x.replace(root, '')))
  hide(ui.pwd)
  hide(ui.dirs)
  show(document.querySelector('#search-controls'))
}

function cd(relpath) {
  if (relpath == '../') {
    pwd = path.up(pwd)
  } else {
    pwd = path.removeLeadingSlash(relpath)
  }
  clearWebframeCache()
  console.log('cd ' + pwd)
  render()
}

function toggleDarkMode() {
  document.querySelector('body').classList.toggle('darkmode')
}

document.querySelector('#modal-controls #close').onclick = e => modal.closeModal()
document.querySelector('#modal-controls #zoom').onclick = e => modal.toggleModalZoom()
document.querySelector('#modal-controls #unzoom').onclick = e => modal.toggleModalZoom()
window.onclick = e => {
    if (e.target == modal.modal.content) {
        modal.closeModal()
    }
}
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'Escape':
      modal.closeModal()
      break;
    case 'z':
      modal.toggleModalZoom()
      break;
    case 'ArrowRight':
      modal.advance(image_list, true)
      break;
    case 'ArrowLeft':
      modal.advance(image_list, false)
      break;
    case 'n':
      toggleDarkMode()
      break;
    default:
      return
  }
})

ui.search.addEventListener("keyup", e => {
  if (e.keyCode === 13) {
    e.preventDefault()
    search(ui.search.value)
  }
})

document.querySelector('#search-controls a').onclick = e => {
  hide(document.querySelector('#search-controls'))
  show(ui.pwd)
  show(ui.dirs)
  cd(pwd)
}

function onDropFile(ev) {
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
  userData.Set({"root_dir": root}, "settings.json")
  hideDragNDrop()
  cd('')
}

menu.UpdateMenu()

if (root != "") {
  cd('')
} else {
  showDragNDrop()
}
