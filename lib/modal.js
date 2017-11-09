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
  modal.content.innerHTML = ''
  modal.content.appendChild(i)
  modal.metadata.src.innerHTML = src
  modal.metadata.description.innerHTML = description
  modal.metadata.tags.innerHTML = tags.join(' ')
}

function openModal() {
  modal.modal.style.display = 'block'
  body.style.overflow = 'hidden'
}

function closeModal() {
  modal.modal.style.display = 'none';
  body.style.overflow = 'visible'
}

function toggleModalZoom() {
  if (modal_zoom) {
    modal.container.className = unzoomed_classname
  } else {
    modal.container.className = zoomed_classname
  }
  modal_zoom = !modal_zoom
}
