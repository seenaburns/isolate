/* external value : Js.t {..} = "value" [@@bs.val]; */

type item = {
  display: string,
  action: unit => unit,
};

type state = {
  filter: string,
  inputRef: ref(option(ReasonReact.reactRef)),
};

type action =
  | Clear
  | Keydown(int)
  | SetFilter(string);

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

let clearInput = inputRef =>
  switch (inputRef^) {
  | None => ()
  | Some(r) => ReasonReact.refToJsObj(r)##value#=""
  };

let applyFilter =
    (items: Js.Array.t(item), query: string)
    : Js.Array.t(item) => {
  let queries = Array.to_list(Js.String.split(" ", query));

  Js.Array.filter(
    (i: item) =>
      List.for_all(q => Js.String.includes(Js.String.toLowerCase(q), Js.String.toLowerCase(i.display)), queries),
    items,
  );
};

let component = ReasonReact.reducerComponent("Directories");
let make =
    (
      ~title: string,
      ~items: Js.Array.t(item),
      ~enabled: bool,
      ~setEnabled: option(bool => unit)=?,
      _children,
    ) => {
  ...component,
  initialState: () => {filter: "", inputRef: ref(None)},
  reducer: (action, state) =>
    switch (action) {
    | SetFilter(s) => ReasonReact.Update({...state, filter: s})
    | Clear =>
      ReasonReact.UpdateWithSideEffects(
        {...state, filter: ""},
        (
          _ => {
            clearInput(state.inputRef);
            blur(state.inputRef);
          }
        ),
      )
    | Keydown(13) =>
      let filtered = applyFilter(items, state.filter);
      if (Js.Array.length(filtered) >= 1) {
        ReasonReact.SideEffects((_ => filtered[0].action()));
      } else {
        ReasonReact.NoUpdate;
      };
    | Keydown(_) => ReasonReact.NoUpdate
    },
  willReceiveProps: self => {
    if (enabled) {
      clearInput(self.state.inputRef);
      focus(self.state.inputRef);
    } else {
      let _ = Js.Global.setTimeout(_ => self.ReasonReact.send(Clear), 200);
      ();
    };
    self.state;
  },
  render: self => {
    let onchange = (e, self) => {
      e##preventDefault();
      self.ReasonReact.send(SetFilter(e##target##value));
    };

    let filtered = applyFilter(items, self.state.filter);
    let directories =
      Js.Array.map(
        (i: item) =>
          <li>
            <a href="#" onClick=(_ => i.action())>
              (ReasonReact.string(i.display))
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
        /* Render cancel button if setEnabled is provided */
        (
          switch (setEnabled) {
          | Some(f) =>
            <div className="close">
              <a href="#" onClick=(_ => f(false))>
                (ReasonReact.string("close"))
              </a>
            </div>
          | None => ReasonReact.null
          }
        )
      </div>
      /* cannot set children directly, see
       * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
      dirList
    </nav>;
  },
};
