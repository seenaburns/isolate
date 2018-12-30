import React from "react";

import { Mode } from "../renderer";
import Directories from "./directories";
import Animated from "./animated";
import PopupMenu from "./popup";
import nightmode from "../lib/nightmode";

const nodePath = require("path");

interface ToolbarProps {
  dirs: string[];
  imageCount: number;
  path: string;
  root: string;

  // State
  mode: Mode;

  // Actions
  cd: (path: string) => void;
  zoom: (zoomIn: boolean) => void;
  setMode: (mode: Mode) => void;
}

interface ToolbarState {
  menuEnabled: boolean;
}

export default class Toolbar extends React.Component<
  ToolbarProps,
  ToolbarState
> {
  state = {
    menuEnabled: true
  };

  componentDidMount() {
    document.addEventListener("keydown", e => {
      const notInput = document.activeElement.tagName !== "INPUT";
      if (e.key === "n" && notInput) {
        e.preventDefault();
        this.setMenuEnabled(true);
      }
    });
  }

  setMenuEnabled(enabled: boolean) {
    this.setState({ menuEnabled: enabled });
  }

  render() {
    const directories = (
      <Animated
        durationMs={150}
        className={"nav"}
        enabled={this.state.menuEnabled}
      >
        <Directories
          title="Navigate"
          items={this.props.dirs.map(d => ({
            display: d,
            action: () => this.props.cd(d)
          }))}
          setEnabled={this.setMenuEnabled.bind(this)}
        />
      </Animated>
    );

    const menuItems = [
      {
        display: "Nightmode",
        action: () => nightmode.toggle()
      }
    ];

    let pwd = this.props.path.replace(this.props.root, "");
    if (pwd === "") {
      pwd = "/";
    }

    return (
      <header
        className="main-header"
        onMouseLeave={() => this.setMenuEnabled(false)}
      >
        {directories}
        <div className="toolbar">
          <div className="left" onMouseEnter={() => this.setMenuEnabled(true)}>
            <h3>{`${pwd} (${this.props.imageCount})`}</h3>
          </div>
          <div className="center">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.props.zoom(false);
              }}
            >
              -
            </a>
            Zoom
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.props.zoom(true);
              }}
            >
              +
            </a>
          </div>
          <div className="right">
            <PopupMenu items={menuItems} />
          </div>
          <input type="text" className="search" placeholder="Search..." />
        </div>
      </header>
    );
  }
}
