import React from "react";

import { Mode } from "../renderer";
import Directories from "./directories";
import Animated from "./animated";

const nodePath = require("path");

interface ToolbarProps {
  dirs: string[];
  imageCount: number;
  pwd: string;

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

  renderModeControls() {
    if (this.props.mode == Mode.Selection) {
      return (
        <a href="#" onClick={() => this.props.setMode(Mode.Modal)}>
          Cancel
        </a>
      );
    }
    return (
      <a href="#" onClick={() => this.props.setMode(Mode.Selection)}>
        Edit
      </a>
    );
  }

  onMouse(enabled: boolean) {
    this.setState({ menuEnabled: enabled });
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

    let basename = this.props.pwd.split(nodePath.sep).pop();
    if (!basename) {
      basename = "/";
    }

    return (
      <header className="main-header" onMouseLeave={() => console.log("TODO")}>
        {directories}
        <div className="toolbar">
          <div className="left" onMouseEnter={() => this.onMouse(true)}>
            <h3>{`${basename} (${this.props.imageCount})`}</h3>
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
          <div className="right" />
          <input type="text" className="search" placeholder="Search..." />
        </div>
      </header>
    );
  }
}
