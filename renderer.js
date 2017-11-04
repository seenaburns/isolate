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

fs.readdirSync(join(root,pwd)).forEach(file => {
  let dirs = document.querySelector('#dirs')
  dirs.innerHTML += '<p>' + file + '</p>'
})

console.log(electron.remote.getGlobal('global').root_dir)
