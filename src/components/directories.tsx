import React from "react";

export default class Directories extends React.Component<{
  dirs: string[];
  cd: (path: string) => void;
}> {
  renderDir(path: string) {
    return (
      <a href="#" onClick={() => this.props.cd(path)}>
        {path}
      </a>
    );
  }

  render() {
    return (
      <div>
        <h2>Directories</h2>
        <ul>
          {this.props.dirs.map(p => {
            return <li key={`li-dir-${p}`}>{this.renderDir(p)}</li>;
          })}
        </ul>
      </div>
    );
  }
}
