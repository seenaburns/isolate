const electron = require('electron')
const fs = require('fs')

const path = require('./lib/path')
const modal = require('./lib/modal')
const db = require('./lib/db')
const util = require('./lib/util')

let pwd = ''
let global = electron.remote.getGlobal('global')
let root = global.root_dir
let global_db = global.db
let global_db_to_path_mapping = global.db_to_path_mapping
let global_files = global.files

function isImage(f) {
  return ['jpeg', 'jpg', 'png'].some(ext => f.split('.').pop() == ext)
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

function setPwd(path) {
  document.querySelector('#pwd').innerHTML = '/' + pwd
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
      console.log(relpath)
      let metadata = db.metadataForPath(global_db, relpath)
      console.log(metadata)
      modal.setModal(
        e.toElement.src,
        metadata.source,
        metadata.description,
        metadata.tags
      )
      modal.openModal()
    }
    i.src = imgUrl(relpath)
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
  let files = fs.readdirSync(path.join(root,pwd)).map(f => path.join(pwd, f))
  setPwd(pwd)
  setDirsNav(files.filter(f => path.isDir(path.join(root, f))))
  setImages(files.filter(f => isImage(f) && path.isFile(path.join(root, f))))
}

function search(term) {
  console.log("Search: " + term)
  let results = db.searchDb(global_db, term)
    .map(md => global_db_to_path_mapping.get(md.path))
    .filter(x => x != undefined)
    .map(x => db.filePathToImages(global_files, x))
    .reduce((a,b) => a.concat(b))
  console.log(results)
  setImages(results.map(x => x.replace(root, '')))
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

document.querySelector('#modal-controls #close').onclick = e => modal.closeModal()
document.querySelector('#modal-controls #zoom').onclick = e => modal.toggleModalZoom()
window.onclick = e => {
    console.log(e.target)
    if (e.target == modal.modal_container) {
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
    default:
      return
  }
})

let search_input = document.querySelector("#search")
search_input.addEventListener("keyup", e => {
  if (e.keyCode === 13) {
    e.preventDefault()
    search(search_input.value)
  }
})

cd('')
