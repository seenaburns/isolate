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
  search?: string;

  // State
  mode: Mode;

  // Actions
  cd: (path: string) => void;
  zoom: (zoomIn: boolean) => void;
  setMode: (mode: Mode) => void;
  setSearch: (query?: string) => void;
  toggleShuffle: () => void;
}

interface ToolbarState {
  menuEnabled: boolean;
}

export default class Toolbar extends React.Component<
  ToolbarProps,
  ToolbarState
> {
  searchRef: any;

  constructor(props: ToolbarProps) {
    super(props);
    this.state = {
      menuEnabled: true
    };
    this.searchRef = React.createRef();

    this.zoom = this.zoom.bind(this);
    this.setMode = this.setMode.bind(this);
  }

  componentDidMount() {
    document.addEventListener("keydown", e => {
      const notInput = document.activeElement.tagName !== "INPUT";
      const noModifier = !(
        e.getModifierState("Alt") ||
        e.getModifierState("Control") ||
        e.getModifierState("Meta") ||
        e.getModifierState("Shift")
      );
      if (notInput && noModifier) {
        if (e.key === "n") {
          e.preventDefault();
          this.setMenuEnabled(true);
        }
        if (this.props.mode === Mode.Modal && e.key === "e") {
          this.setMode(Mode.Selection)(e);
        }
        if (this.props.mode === Mode.Selection && e.key === "m") {
          this.setMode(Mode.Move)(e);
        }
      }

      // Even if in input escape should:
      // Go from Move -> Selection
      // Go from Selection -> Modal
      if (e.key === "Escape") {
        if (this.props.mode === Mode.Move) {
          this.setMode(Mode.Selection)(e);
        } else if (this.props.mode === Mode.Selection) {
          this.setMode(Mode.Modal)(e);
        }
      }
    });
  }

  zoom(zoomIn: boolean) {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.props.zoom(zoomIn);
    };
  }

  setMode(mode: Mode) {
    return (event?: React.MouseEvent<HTMLAnchorElement> | KeyboardEvent) => {
      if (event) {
        event.preventDefault();
      }

      if (mode === Mode.Move) {
        this.setMenuEnabled(true);
      } else if (mode === Mode.Modal || mode === Mode.Selection) {
        this.setMenuEnabled(false);
      }

      this.props.setMode(mode);
    };
  }

  setMenuEnabled(enabled: boolean) {
    this.setState({ menuEnabled: enabled });
  }

  isSearching() {
    return this.props.search && this.props.search !== "";
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
        action: () => this.setMode(Mode.Selection)(null)
      },
      {
        display: "Shuffle",
        action: () => this.props.toggleShuffle()
      },
      {
        display: "Nightmode",
        action: () => nightmode.toggle()
      }
    ];

    return <PopupMenu items={menuItems} />;
  }

  renderMoveControls() {
    return (
      <div className="edit">
        <a href="#" onClick={this.setMode(Mode.Move)}>
          Move
        </a>
        <a href="#" onClick={this.setMode(Mode.Modal)}>
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

  renderPwd() {
    if (this.isSearching()) {
      return (
        <h3>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              this.props.setSearch(undefined);
              this.searchRef.current.value = "";
            }}
          >
            Cancel
          </a>
        </h3>
      );
    }

    return (
      <h3>{`${trimRelativeToRoot(this.props.path, this.props.root)} (${
        this.props.imageCount
      })`}</h3>
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
        {!this.isSearching() && this.renderDirectories()}
        <div className="toolbar">
          <div className="left" onMouseEnter={() => this.setMenuEnabled(true)}>
            {this.renderPwd()}
          </div>
          <div className="center">{this.renderZoom()}</div>
          <div className="right">
            {!this.isModeMoving() && this.renderPopup()}
            {this.isModeMoving() && this.renderMoveControls()}
            <input
              type="text"
              className="search"
              placeholder="Search..."
              ref={this.searchRef}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const target = e.target as HTMLInputElement;
                  this.props.setSearch(target.value);
                }
              }}
            />
          </div>
        </div>
      </header>
    );
  }
}
