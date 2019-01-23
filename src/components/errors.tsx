import React from "react";

export default class Errors extends React.Component<{
  errors: string[];
}> {
  render() {
    if (this.props.errors.length == 0) {
      return null;
    }

    return (
      <div>
        <h2>Errors</h2>
        <ul>
          {this.props.errors.map((err, i) => {
            return <li key={`err-${i}`}>{err}</li>;
          })}
        </ul>
      </div>
    );
  }
}
