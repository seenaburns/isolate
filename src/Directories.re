/* external value : Js.t {..} = "value" [@@bs.val]; */

type state = {
  filter: string,
  inputRef: ref(option(ReasonReact.reactRef)),
};

type action =
  | SetFilter(string);

let setInputRef = (r, {ReasonReact.state}) =>
  state.inputRef := Js.Nullable.toOption(r);

let focus = inputRef =>
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##focus()
  };

let clearInput = inputRef => {
  Js.log("Clear");
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##value#=""
  };
};

let component = ReasonReact.reducerComponent("Directories");
let make =
    (
      ~title: string,
      ~items: array(Path.base),
      ~setPwd,
      ~renderPath: Path.base => string,
      ~enabled: bool,
      _children,
    ) => {
  ...component,
  initialState: () => {filter: "", inputRef: ref(None)},
  reducer: (action, state) =>
    switch (action) {
    | SetFilter(s) => ReasonReact.Update({...state, filter: s})
    },
  willReceiveProps: ({state}) => {
    clearInput(state.inputRef);
    if (enabled) {
      focus(state.inputRef)
    };
    {...state, filter: ""};
  },
  render: self => {
    let onchange = (e, self) => {
      e##preventDefault();
      self.ReasonReact.send(SetFilter(e##target##value));
    };

    let queryRe = Js.Re.fromString(self.state.filter);

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
          "onChange": self.handle(onchange),
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
