/* external value : Js.t {..} = "value" [@@bs.val]; */

type state = {
  filter: string,
  inputRef: ref(option(ReasonReact.reactRef)),
};

type action =
  | SetFilter(string)
  | Keydown(int);

let setInputRef = (r, {ReasonReact.state}) =>
  state.inputRef := Js.Nullable.toOption(r);

let focus = inputRef =>
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##focus()
  };

let blur = inputRef =>
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##blur()
  };

let clearInput = inputRef => {
  Js.log("Clear");
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##value#=""
  };
};

let applyFilter =
    (items: Js.Array.t(Path.base), query: string)
    : Js.Array.t(Path.base) =>
  Js.Array.filter(
    (i: Path.base) => {
      let queryRe = Js.Re.fromString(query);
      Js.Option.isSome(Js.Re.exec(i.path, queryRe));
    },
    items,
  );

let component = ReasonReact.reducerComponent("Directories");
let make =
    (
      ~title: string,
      ~items: Js.Array.t(Path.base),
      ~setPwd,
      ~renderPath: Path.base => string,
      ~enabled: bool,
      ~setEnabled: bool => unit,
      _children,
    ) => {
  ...component,
  initialState: () => {filter: "", inputRef: ref(None)},
  reducer: (action, state) =>
    switch (action) {
    | SetFilter(s) => ReasonReact.Update({...state, filter: s})
    | Keydown(13) =>
      let filtered: Js.Array.t(Path.base) = applyFilter(items, state.filter);
      if (Js.Array.length(filtered) >= 1) {
        ReasonReact.SideEffects((_ => setPwd(filtered[0])));
      } else {
        ReasonReact.NoUpdate;
      };
    | Keydown(_) => ReasonReact.NoUpdate
    },
  willReceiveProps: ({state}) => {
    clearInput(state.inputRef);
    if (enabled) {
      focus(state.inputRef);
    } else {
      blur(state.inputRef);
    };
    {...state, filter: ""};
  },
  render: self => {
    let onchange = (e, self) => {
      e##preventDefault();
      self.ReasonReact.send(SetFilter(e##target##value));
    };

    let filtered: Js.Array.t(Path.base) =
      applyFilter(items, self.state.filter);
    let directories =
      Js.Array.map(
        (p: Path.base) =>
          <li>
            <a href="#" onClick=(_ => setPwd(p))>
              (ReasonReact.string(renderPath(p)))
            </a>
          </li>,
        filtered,
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
          "onKeyDown": e =>
            self.send(Keydown(ReactEventRe.Keyboard.which(e))),
        },
        [||],
      );

    let navClassName = if (enabled) {"enabled"} else {"disabled"};

    <nav
      className=navClassName onMouseEnter=(_ => focus(self.state.inputRef))>
      <div className="title">
        <h3> (ReasonReact.string(title)) </h3>
        input
        <div className="close">
          <a href="#" onClick=(_ => setEnabled(false))>
            (ReasonReact.string("close"))
          </a>
        </div>
      </div>
      /* cannot set children directly, see
       * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
      dirList
    </nav>;
  },
};
