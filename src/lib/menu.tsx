const electron = require("electron");
const app = electron.remote.app;

const options = {
  ModalOpen: false,
  NightMode: false
};

// Functions initialized to nothing
// Other modules should inject appropriate functions
const functions = {
  Copy: function() {},
  NightMode: function() {},
  OpenLocation: function() {},
  ZoomIn: function() {},
  ZoomOut: function() {}
};

export default {
  UpdateMenu: UpdateMenu,
  Options: options,
  Functions: functions,
  EditSubMenu: EditSubMenu,
  setModalOpen: setModalOpen
};

function setModalOpen(open: boolean) {
  options.ModalOpen = open;
  UpdateMenu();
}

function UpdateMenu() {
  app.inject_menu([
    {
      label: "Application",
      submenu: [
        {
          label: "Night Mode",
          type: "checkbox",
          accelerator: "CmdOrCtrl+N",
          checked: options.NightMode,
          click: functions.NightMode
        },
        { type: "separator" },
        {
          label: "Open Dev Tools",
          accelerator: "CmdOrCtrl+Option+I",
          click: electron.remote.getCurrentWindow().webContents.openDevTools
        },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: EditSubMenu()
    },
    {
      label: "View",
      submenu: [
        {
          label: "Zoom In",
          accelerator: "CmdOrCtrl+=",
          click: functions.ZoomIn
        },
        {
          label: "Zoom Out",
          accelerator: "CmdOrCtrl+-",
          click: functions.ZoomOut
        }
      ]
    }
  ]);
}

function EditSubMenu() {
  return [
    {
      label: "Show Image in Finder",
      accelerator: "CmdOrCtrl+Shift+O",
      click: functions.OpenLocation,
      enabled: options.ModalOpen
    },
    {
      label: "Copy Image",
      accelerator: "CmdOrCtrl+Shift+C",
      click: functions.Copy,
      enabled: options.ModalOpen
    }
  ];
}
