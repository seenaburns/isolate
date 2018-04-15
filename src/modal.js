const util = require('./util')

let modal = {
  'modal': document.getElementById('modal'),
  'container': document.getElementById('modal-container'),
  'content': document.getElementById('modal-content'),
  'metadata': {
    'description': document.querySelector('#viewer-description'),
    'src': document.querySelector('#viewer-src'),
    'tags': document.querySelector('#viewer-tags')
  }
}
let body = document.querySelector('body')

let zoomed_classname = "modal-container modal-zoomed"
let unzoomed_classname = "modal-container modal-unzoomed"
var modal_zoom = false
let curr_img = ""

module.exports = {
  isModalOpen: isModalOpen,
  currentImage: currentImage,
  closeModal: closeModal,
  openModal: openModal,
  setModal: setModal,
  modal: modal,
  toggleModalZoom: toggleModalZoom,
  advance: advance
}

function setModal(imageUrl, relpath="") {
  let i = document.createElement('img')
  i.src = imageUrl
  util.setHTML(modal.content, i)

  // Render metadata
  src = imageUrl.replace('file://', '')
  util.setHTML(modal.metadata.src, util.externalLinkToLocation(src,src))
  modal.metadata.description.innerHTML = ''
  modal.metadata.tags.innerHTML = ''
  curr_img = imageUrl
}

function isModalOpen() {
  return modal.modal.style.display == 'block'
}

function currentImage() {
  return curr_img
}

function openModal() {
  modal.modal.style.display = 'block'
  body.style.overflow = 'hidden'
}

function closeModal() {
  modal.modal.style.display = 'none';
  body.style.overflow = 'visible'
  setModalZoom(false)
}

function setModalZoom(bool) {
  if (bool) {
    modal.container.className = zoomed_classname
  } else {
    modal.container.className = unzoomed_classname
  }

  // Set focus
  modal.content.tabIndex = 0
  modal.content.focus()

  modal_zoom = bool
}

function toggleModalZoom() {
  setModalZoom(!modal_zoom)
}

function advance(images, forward) {
  if (modal_zoom) {
    return;
  }

  current_index = images.findIndex(i => i == curr_img)
  let next = current_index
  if (forward && next < images.length - 1) {
    next = current_index + 1
  } else if (!forward && next > 0) {
    next = current_index - 1
  }

  setModal(images[next])
}
