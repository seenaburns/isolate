const electron = require('electron')

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

app = require('electron').remote.app;
function UpdateMenu() {
  app.inject_menu([
    {
    label: "Application",
      submenu: [
        { label: "Night Mode", type: "checkbox", accelerator: "CmdOrCtrl+N", checked: options.NightMode, click: functions.NightMode },
        { type: "separator" },
        { label: "Open Dev Tools", accelerator: "CmdOrCtrl+Option+I", click: electron.remote.getCurrentWindow().webContents.openDevTools },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Show Image in Finder", accelerator: "CmdOrCtrl+Shift+O", click: functions.OpenLocation, enabled: options.ModalOpen },
        { label: "Copy Image", accelerator: "CmdOrCtrl+C", click: functions.Copy, enabled: options.ModalOpen },
      ]
    }
  ])
}
