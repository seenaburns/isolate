import React from "react";

import { Mode } from "../renderer";

interface ToolbarProps {
  // State
  mode: Mode;

  // Actions
  zoom: (zoomIn: boolean) => void;
  setMode: (mode: Mode) => void;
}

export default class Toolbar extends React.Component<ToolbarProps> {
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

  render() {
    return (
      <div className="controls">
        {this.renderModeControls()}
        <a href="#" onClick={() => this.props.zoom(true)}>
          zin
        </a>
        <a href="#" onClick={() => this.props.zoom(false)}>
          zout
        </a>
      </div>
    );
  }
}
