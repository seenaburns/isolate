type state = {
  inputRef: ref(option(ReasonReact.reactRef)),
};

let setInputRef = (r, {ReasonReact.state}) =>
  state.inputRef := Js.Nullable.toOption(r);

let focus = inputRef =>
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##focus()
  };

let component = ReasonReact.reducerComponent("Directories");
let make =
    (
      ~items: array(Path.base),
      ~renderPath: Path.base => string,
      ~filter,
      ~setFilter,
      ~setPwd,
      ~title: string,
      _children,
    ) => {
  ...component,
  initialState: () => {inputRef: ref(None)},
  reducer: (_action: unit, _) => ReasonReact.NoUpdate,
  render: self => {
    let onchange = (e) => {
      e##preventDefault();
      setFilter(e##target##value);
    };

    let queryRe = Js.Re.fromString(filter);

    let directories =
      Array.map(
        (p: Path.base) =>
          if (Js.Option.isSome(Js.Re.exec(p.path, queryRe))) {
            <li>
              <a href="#" onClick=(setPwd(p))>
                (ReasonReact.string(renderPath(p)))
              </a>
            </li>;
          } else {
            ReasonReact.null;
          },
        items,
      );

    let dirList =
      ReasonReact.createDomElement("ul", ~props={"id": "dirs"}, directories);

    let input =
      ReasonReact.createDomElement(
        "input",
        ~props={
          "type": "text",
          "class": "filter",
          "placeholder": "Type to filter...",
          "onChange": onchange,
          "ref": self.handle(setInputRef),
        },
        [||],
      );

    <nav onMouseEnter=(_ => focus(self.state.inputRef))>
      <div className="title">
        <h3> (ReasonReact.string(title)) </h3>
        input
      </div>
      /* cannot set children directly, see
       * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
      dirList
    </nav>;
  },
};
