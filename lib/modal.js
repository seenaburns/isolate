let modal = document.getElementById('modal')
let modal_content = document.getElementById('modal-content')
let body = document.querySelector('body')

module.exports = {
  closeModal: closeModal,
  openModal: openModal,
  setModal: setModal,
  modal: modal,
  modal_content: modal_content
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
