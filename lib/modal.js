let modal = document.getElementById('modal')
let modal_container = document.getElementById('modal-container')
let modal_content = document.getElementById('modal-content')
let body = document.querySelector('body')

let zoomed_classname = "modal-container modal-zoomed"
let unzoomed_classname = "modal-container modal-unzoomed"
var modal_zoom = false

module.exports = {
  closeModal: closeModal,
  openModal: openModal,
  setModal: setModal,
  modal: modal,
  modal_content: modal_content,
  toggleModalZoom: toggleModalZoom
}

function setModal(imageUrl) {
  let i = document.createElement('img')
  i.src = imageUrl
  modal_content.innerHTML = ''
  modal_content.appendChild(i)
}

function openModal() {
  modal.style.display = 'block'
  body.style.overflow = 'hidden'
}

function closeModal() {
  modal.style.display = 'none';
  body.style.overflow = 'visible'
}

function toggleModalZoom() {
  if (modal_zoom) {
    modal_container.className = unzoomed_classname
  } else {
    modal_container.className = zoomed_classname
  }
  modal_zoom = !modal_zoom
}
