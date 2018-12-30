import React from "react";

interface Item {
  display: string;
  action: () => void;
}

interface Props {
  title: string;
  items: Item[];
  setEnabled?: (enabled: boolean) => void;
}

interface State {
  filter: string;
}

export default class Directories extends React.Component<Props, State> {
  inputRef: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      filter: ""
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.focusInput();
  }

  focusInput() {
    this.inputRef.current.focus();
  }

  onFilterKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const filtered = this.filteredItems();
      if (filtered.length > 0) {
        this.selectItem(filtered[0]);
      }
    } else if (e.key === "Escape") {
      this.props.setEnabled(false);
    }
  }

  onFilterInput(e: Event) {
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    this.setState({
      filter: target.value
    });
  }

  filteredItems() {
    const queries = this.state.filter.split(" ").filter(q => q !== "");
    if (queries.length === 0) {
      return this.props.items;
    }
    return this.props.items.filter(i =>
      queries.some(query =>
        i.display.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  selectItem(item: Item) {
    this.filteredItems();
    this.inputRef.current.value = "";
    this.setState({
      filter: ""
    });
    this.focusInput();
    item.action();
  }

  render() {
    const filtered = this.filteredItems();
    return (
      <nav onMouseEnter={() => this.focusInput()}>
        <div className="title">
          <h3>{this.props.title}</h3>
          <input
            type="text"
            className="filter"
            placeholder="Type to filter..."
            onChange={this.onFilterInput.bind(this)}
            ref={this.inputRef}
            onKeyDown={this.onFilterKeydown.bind(this)}
          />
          <div className="close">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                this.props.setEnabled(false);
              }}
            >
              close
            </a>
          </div>
        </div>
        <ul id="dirs">
          {filtered.map(i => (
            <li key={`li-dirs-${i.display}`}>
              <a href="#" onClick={() => this.selectItem(i)}>
                {i.display}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}
