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

module.exports = {
  closeModal: closeModal,
  openModal: openModal,
  setModal: setModal,
  modal: modal,
  toggleModalZoom: toggleModalZoom
}

function setModal(imageUrl, src="", description="", tags=[]) {
  let i = document.createElement('img')
  i.src = imageUrl
  util.setHTML(modal.content, i)

  // Render metadata
  util.setHTML(modal.metadata.src, util.externalLink(src,src))
  modal.metadata.description.innerHTML = description
  let renderedTags =
    tags.map(t => {
      let a = util.link('#', t)
      a.className = 'tag'
      return a
    })
  modal.metadata.tags.innerHTML = ''
  renderedTags.forEach(t => {
    modal.metadata.tags.appendChild(t)
    modal.metadata.tags.innerHTML += ' '
  })
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
  modal_zoom = bool
}

function toggleModalZoom() {
  setModalZoom(!modal_zoom)
}
