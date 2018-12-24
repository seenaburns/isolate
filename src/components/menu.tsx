import React from "react";

interface MenuProps {
  title: string;
  items: MenuItem[];
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export default class Menu extends React.Component<MenuProps> {
  render() {
    const className = this.props.enabled
      ? "popup-container enabled"
      : "popup-container disabled";
    return (
      <div
        className="more"
        onMouseEnter={() => this.props.setEnabled(true)}
        onMouseLeave={() => this.props.setEnabled(false)}
      >
        <div>{this.props.title}</div>
        <div className={className}>
          <div className={"popup"}>
            <div className={"enu-items"}>
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
