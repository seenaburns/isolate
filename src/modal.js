const menu = require('./menu')
const util = require('./util')

const reason = require('./main.bs')

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
}

function setModal(imageUrl, images) {
  console.log("setModal")
  reason.setModal(imageUrl)
  reason.setImageList(images)
}

function isModalOpen() {
  console.log("isModalOpen")
  return reason.isModalOpen()
}

function currentImage() {
  console.log("currentImage")
  return reason.currentImage()
}

function openModal() {
  console.log("openModal")
  reason.openModal()
}

function closeModal() {
  console.log("closeModal")
  reason.closeModal()
}
