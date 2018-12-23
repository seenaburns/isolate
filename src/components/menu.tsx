import React from "react";

export interface MenuItem {
  text: string;
  action: () => void;
}

interface MenuProps {
  title: string;
  items: MenuItem[];
}

interface MenuState {
  enabled: boolean;
}

export default class Menu extends React.Component<MenuProps, MenuState> {
  state = {
    enabled: false
  };

  setEnabled(enabled: boolean) {
    this.setState({ enabled: enabled });
  }

  render() {
    const className = this.state.enabled
      ? "popup-container enabled"
      : "popup-container disabled";
    return (
      <div
        className="more"
        onMouseEnter={() => this.setEnabled(true)}
        onMouseLeave={() => this.setEnabled(false)}
      >
        <div>{this.props.title}</div>
        <div className={className}>
          <div className={"popup"}>
            <div className={"menu-items"}>
              {this.props.items.map(i => {
                return (
                  <div className="menu-item" onClick={() => i.action()}>
                    {i.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
