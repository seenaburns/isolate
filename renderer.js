// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron')
const fs = require('fs')

let pwd = ''
let root = electron.remote.getGlobal('global').root_dir

function join(a,b) {
  return a + '/' + b
}

function isDir(f) {
  return fs.lstatSync(join(root, f)).isDirectory()
}

function isFile(f) {
  return fs.lstatSync(join(root,f)).isFile()
}

function isImage(f) {
  return ['jpeg', 'jpg', 'png'].some(ext => f.split('.').pop() == ext)
}

function setDirsNav(dirs) {
  let renderDir = function (d) {
    let l = document.createElement('li')
    l.innerHTML = '<a href="#">' + d + '</a>'
    return l
  }

  let dirs_container = document.querySelector('#dirs ul')
  dirs_container.innerHTML = ""
  dirs.forEach(d => {
    dirs_container.appendChild(renderDir(d))
  })
}

function setPwd(path) {
  document.querySelector('#pwd').innerHTML = '/' + pwd
}

function setImages(images) {
  let renderImage = function(path) {
    let iw = document.createElement('div')
    iw.className = "iw"
    let i = document.createElement('img')
    i.src = 'file://' + join(root, path)
    iw.appendChild(i)
    return iw
  }

  let images_container = document.querySelector('#images')
  images_container.innerHTML = ""
  images.forEach(i => {
    images_container.appendChild(renderImage(i))
  })
}

let files = fs.readdirSync(join(root,pwd))
setPwd(pwd)
setDirsNav(files.filter(f => isDir(f)))
setImages(files.filter(f => isImage(f) && isFile(f)))

console.log(electron.remote.getGlobal('global').root_dir)
