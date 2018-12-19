import React from "react";
import { Image } from "../lib/image";

export default class Images extends React.Component<{ images: Image[] }> {
  render() {
    if (this.props.images.length == 0) {
      return null;
    }

    return (
      <div>
        <h2>Files</h2>
        <ul>
          {this.props.images.map(i => {
            return <li key={`li-i-${i.absolutePath}`}>{i.absolutePath}</li>;
          })}
        </ul>
      </div>
    );
  }
}
