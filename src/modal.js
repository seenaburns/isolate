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
  toggleModalZoom: toggleModalZoom,
  advance: advance
}

function setModal(imageUrl, relpath="") {
  console.log("setModal")
  reason.setModal(imageUrl)
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

function setModalZoom(bool) {
  console.log("setModalZoom")
  reason.setModalZoom(bool)
}

function toggleModalZoom() {
  console.log("toggleModalZoom")
  reason.toggleModalZoom()
}

function advance(images, forward) {
  console.log("advance")
  reason.advance(images, forward)
}
