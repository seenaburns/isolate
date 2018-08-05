let component = ReasonReact.statelessComponent("Directories");
let make =
    (
      ~title: string,
      ~items: array(Path.base),
      ~setPwd,
      ~renderPath: (Path.base) => string,
      _children,
    ) => {
  ...component,
  render: _self => {
    let directories =
      Array.map(
        (p: Path.base) =>
          <li>
            <a href="#" onClick=(setPwd(p))>
              (ReasonReact.string(renderPath(p)))
            </a>
          </li>,
        items,
      );

    let dirList = ReasonReact.createDomElement("ul", ~props={"id": "dirs"}, directories);

    let input =
      ReasonReact.createDomElement(
        "input",
        ~props={
          "type": "text",
          "class": "filter",
          "placeholder": "Type to filter...",
        },
        [||],
      );

    <nav>
      <div className="title">
        <h3>(ReasonReact.string(title))</h3>
        input
      </div>
      /* cannot set children directly, see
      * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
      dirList
    </nav>;
  },
};
