import React from "react";
import menu from "../lib/menu";
import nightmode from "../lib/nightmode";

const electron = require("electron");
const app = electron.remote.app as any;

interface Props {
  modalPath?: string;
  nightmodeEnabled: boolean;

  zoom: (zoomIn: boolean) => void;
}

// Wraps lib/menu.js with stateful react component to manage the application menu
// Simplifies watching app state changes and menu mount/state
export default class Menu extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.isModalOpen = this.isModalOpen.bind(this);
    this.openLocationMenu = this.openLocationMenu.bind(this);
    this.copyMenu = this.copyMenu.bind(this);
  }

  componentDidMount() {
    // Initialize menu
    menu.Functions.Copy = this.copyMenu;
    menu.Functions.NightMode = () => nightmode.toggle();
    menu.Functions.OpenLocation = this.openLocationMenu;
    menu.Functions.ZoomIn = () => this.props.zoom(true);
    menu.Functions.ZoomOut = () => this.props.zoom(false);
    menu.Options.NightMode = this.props.nightmodeEnabled;
    menu.UpdateMenu();

    // Initialize context (right click) menu
    const contextMenu = new electron.remote.Menu();
    menu.EditSubMenu().forEach(a => {
      a.enabled = true;
      contextMenu.append(new electron.remote.MenuItem(a));
    });

    window.addEventListener("contextmenu", e => {
      if (this.isModalOpen()) {
        e.preventDefault();
        contextMenu.popup({ window: electron.remote.getCurrentWindow() });
      }
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.modalPath !== this.props.modalPath) {
      menu.setModalOpen(this.isModalOpen());
    }
  }

  copyMenu() {
    if (this.isModalOpen()) {
      // TODO: crossPlatform path transformation
      let p = this.props.modalPath;
      p = p.replace("file://", "");
      console.log("copy", p);
      const nativeImage = electron.nativeImage.createFromPath(p);
      electron.clipboard.writeImage(nativeImage);
    }
  }

  openLocationMenu() {
    if (this.isModalOpen()) {
      // TODO: crossPlatform path transformation
      let p = this.props.modalPath;
      p = p.replace("file://", "");
      console.log("open", p);
      app.showItemInFolder(p);
    }
  }

  isModalOpen() {
    return this.props.modalPath !== undefined;
  }

  render(): any {
    return null;
  }
}
