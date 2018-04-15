const {clipboard, nativeImage} = require('electron')

const modal = require('./modal')

module.exports = {
  SetMenu: SetMenu,
}

function copyMenu(menuItem, browserWindow, event) {
  if (modal.isModalOpen()) {
    imageUrl = modal.currentImage().replace('file://', '')
    clipboard.writeImage(nativeImage.createFromPath(fullpath))
  }
}

app = require('electron').remote.app;
function SetMenu() {
  app.inject_menu(
  [{
      label: "Application",
      submenu: [
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Copy", accelerator: "CmdOrCtrl+C", click: copyMenu },
      ]}
  ]
  )
}
