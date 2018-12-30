import React from "react";

import { Mode } from "../renderer";
import Directories from "./directories";
import Animated from "./animated";
import PopupMenu from "./popup";
import nightmode from "../lib/nightmode";
import { fstat } from "fs";
import { directoryWalk, trimRelativeToRoot, unsafeMoveAll } from "../lib/fs";

const nodePath = require("path");

interface ToolbarProps {
  dirs: string[];
  imageCount: number;
  path: string;
  root: string;
  selection: string[];

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
  constructor(props: ToolbarProps) {
    super(props);
    this.state = {
      menuEnabled: true
    };

    this.zoom = this.zoom.bind(this);
    this.setMode = this.setMode.bind(this);
  }

  zoom(zoomIn: boolean) {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.props.zoom(zoomIn);
    };
  }

  setMode(mode: Mode) {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.props.setMode(mode);
    };
  }

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

  renderZoom() {
    return (
      <span>
        <a href="#" onClick={this.zoom(false)}>
          -
        </a>
        Zoom
        <a href="#" onClick={this.zoom(true)}>
          +
        </a>
      </span>
    );
  }

  isModeMoving() {
    return this.props.mode !== Mode.Modal;
  }

  renderPopup() {
    const menuItems = [
      {
        display: "Move",
        action: () => {
          this.props.setMode(Mode.Selection);
          this.setMenuEnabled(false);
        }
      },
      {
        display: "Nightmode",
        action: () => nightmode.toggle()
      }
    ];

    return (
      <div className="right">
        <PopupMenu items={menuItems} />
      </div>
    );
  }

  renderMoveControls() {
    return (
      <div className="edit">
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            this.setMode(Mode.Move)(e);
            this.setMenuEnabled(true);
          }}
        >
          Move
        </a>
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            this.setMode(Mode.Modal)(e);
            this.setMenuEnabled(false);
          }}
        >
          Cancel
        </a>
      </div>
    );
  }

  renderDirectories() {
    let inner;
    if (this.props.mode !== Mode.Move) {
      inner = (
        <Directories
          title="Navigate"
          items={this.props.dirs.map(d => ({
            display: d,
            action: () => this.props.cd(d)
          }))}
          setEnabled={this.setMenuEnabled.bind(this)}
        />
      );
    } else {
      const dirs = directoryWalk(this.props.root).dirs;
      inner = (
        <Directories
          title="Select destination:"
          items={dirs.map(d => ({
            display: trimRelativeToRoot(d, this.props.root),
            action: () => {
              this.props.setMode(Mode.Modal);
              unsafeMoveAll(this.props.selection, d).then(() => {
                this.props.cd("");
              });
            }
          }))}
          setEnabled={this.setMenuEnabled.bind(this)}
        />
      );
    }

    return (
      <Animated
        durationMs={150}
        className={"nav"}
        enabled={this.state.menuEnabled}
      >
        {inner}
      </Animated>
    );
  }

  render() {
    return (
      <header
        className="main-header"
        onMouseLeave={() => {
          if (this.props.mode !== Mode.Move) {
            this.setMenuEnabled(false);
          }
        }}
      >
        {this.renderDirectories()}
        <div className="toolbar">
          <div className="left" onMouseEnter={() => this.setMenuEnabled(true)}>
            <h3>{`${trimRelativeToRoot(this.props.path, this.props.root)} (${
              this.props.imageCount
            })`}</h3>
          </div>
          <div className="center">{this.renderZoom()}</div>
          <div className="right">
            {!this.isModeMoving() && this.renderPopup()}
            {this.isModeMoving() && this.renderMoveControls()}
            <input type="text" className="search" placeholder="Search..." />
          </div>
        </div>
      </header>
    );
  }
}
