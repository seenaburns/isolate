import React from "react";

interface Props {
  title: string;
  items: {
    display: string;
    action: () => void;
  }[];
  setEnabled?: (enabled: boolean) => void;
}

interface State {
  filter: string;
}

export default class Directories extends React.Component<Props, State> {
  inputRef: any;

  state = {
    filter: ""
  };

  constructor(props: Props) {
    super(props);
    this.inputRef = React.createRef();
  }

  onChange(e: Event) {
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    this.setState({
      filter: target.value
    });
  }

  render() {
    const queries = this.state.filter.split(" ");
    const filtered = this.props.items.filter(i =>
      queries.some(query =>
        i.display.toLowerCase().includes(query.toLowerCase())
      )
    );

    return (
      <nav>
        <div className="title">
          <h3>{this.props.title}</h3>
          <input
            type="text"
            className="filter"
            placeholder="Type to filter..."
            onChange={this.onChange.bind(this)}
            ref={this.inputRef}
          />
          <div className="close">
            <a href="#" onClick={() => this.props.setEnabled(false)}>
              close
            </a>
          </div>
        </div>
        <ul id="dirs">
          {filtered.map(i => (
            <li key={`li-dirs-${i.display}`}>
              <a href="#" onClick={() => i.action()}>
                {i.display}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}
