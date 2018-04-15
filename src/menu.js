options = {
  copyEnabled: false,
}

module.exports = {
  UpdateMenu: UpdateMenu,
  Options: options,
}

const {clipboard, nativeImage} = require('electron')

const modal = require('./modal')

function copyMenu(menuItem, browserWindow, event) {
  if (modal.isModalOpen()) {
    imageUrl = modal.currentImage().replace('file://', '')
    clipboard.writeImage(nativeImage.createFromPath(fullpath))
  }
}

app = require('electron').remote.app;
function UpdateMenu() {
  app.inject_menu(
  [{
      label: "Application",
      submenu: [
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Copy", accelerator: "CmdOrCtrl+C", click: copyMenu, enabled: options.copyEnabled },
      ]}
  ]
  )
}
