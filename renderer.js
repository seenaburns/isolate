// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron')
const fs = require('fs')

let pwd = ''
let root = electron.remote.getGlobal('global').root_dir

function join(a,b) {
  return removeDuplicateSlash(a + '/' + b)
}

function removeLeadingSlash(path) {
  if (path.length > 0 && path[0] == '/') {
    return path.slice(1,path.length)
  } else {
    return path
  }
}

function removeDuplicateSlash(path) {
  return path.replace('//', '/')
}

function up(path) {
  let parts = path.split('/')
  return parts.slice(0,parts.length-1).join('')
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
  let renderDir = function (d, path) {
    let l = document.createElement('li')
    let a = document.createElement('a')
    a.href = '#'
    a.setAttribute('path', path)
    a.innerHTML = d
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

function render() {
  let files = fs.readdirSync(join(root,pwd)).map(f => join(pwd, f))
  setPwd(pwd)
  setDirsNav(files.filter(f => isDir(f)))
  setImages(files.filter(f => isImage(f) && isFile(f)))
}

function cd(relpath) {
  if (relpath == '../') {
    pwd = up(pwd)
  } else {
    pwd = removeLeadingSlash(relpath)
  }
  console.log('cd ' + pwd)
  render()
}

cd('')
