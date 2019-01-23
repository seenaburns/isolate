import React from "react";
import { string } from "prop-types";
import Animated from "./animated";

interface PopupItem {
  display: string;
  action: () => void;
}

interface Props {
  items: PopupItem[];
}

interface State {
  enabled: boolean;
}

export default class PopupMenu extends React.Component<Props, State> {
  state = {
    enabled: false
  };

  setEnabled(enabled: boolean) {
    this.setState({
      enabled: enabled
    });
  }

  render() {
    return (
      <div
        className="more"
        onMouseEnter={() => this.setEnabled(true)}
        onMouseLeave={() => this.setEnabled(false)}
      >
        <div>More</div>
        <Animated
          durationMs={200}
          className={"popup-container"}
          enabled={this.state.enabled}
        >
          <div className="popup">
            {this.props.items.map(i => (
              <div
                className="menu-item"
                key={`menu-item-${i.display}`}
                onClick={() => i.action()}
              >
                {i.display}
              </div>
            ))}
          </div>
        </Animated>
      </div>
    );
  }
}
