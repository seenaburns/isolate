options = {
  ModalOpen: false,
  NightMode: false,
}

// Functions initialized to nothing
// Other modules should inject appropriate functions
functions = {
  Copy: function() {},
  NightMode: function() {},
  OpenLocation: function () {},
}

module.exports = {
  UpdateMenu: UpdateMenu,
  Options: options,
  Functions: functions,
}

const {clipboard, nativeImage} = require('electron')

app = require('electron').remote.app;
function UpdateMenu() {
  app.inject_menu(
  [{
      label: "Application",
      submenu: [
        { label: "Night Mode", type: "checkbox", accelerator: "N", checked: options.NightMode, click: functions.NightMode },
        { type: "separator" },
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}, {
      label: "Edit",
      submenu: [
          { label: "Show Image in Finder", accelerator: "CmdOrCtrl+Shift+O", click: functions.OpenLocation, enabled: options.ModalOpen },
          { label: "Copy", accelerator: "CmdOrCtrl+C", click: functions.Copy, enabled: options.ModalOpen },
      ]}
  ]
  )
}
