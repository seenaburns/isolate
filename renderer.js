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

function filterDirs(files) {
  return files.filter(f => fs.lstatSync(join(root, f)).isDirectory())
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
  // dirs_container.innerHTML += "</ul>"
}

function setPwd(path) {
  document.querySelector('#pwd').innerHTML = '/' + pwd
}

let files = fs.readdirSync(join(root,pwd))
setDirsNav(filterDirs(files))

setPwd(pwd)

console.log(electron.remote.getGlobal('global').root_dir)
