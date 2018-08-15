type mode =
  | Normal
  | Editing
  | Moving;

type state = {
  filter: string,
  inputRef: ref(option(ReasonReact.reactRef)),
};

type action =
  | SetMoving(bool)
  | SetFilter(string);

let setInputRef = (r, {ReasonReact.state}) =>
  state.inputRef := Js.Nullable.toOption(r);

let component = ReasonReact.reducerComponent("Edit");
let make = (~mode, ~pwd, ~root, ~onClick, ~move, _children) => {
  ...component,
  initialState: () => {filter: "", inputRef: ref(None)},
  didUpdate: ({oldSelf, newSelf}) =>
    switch (newSelf.state.inputRef^) {
    | None => ()
    | Some(r) => ReasonReact.refToJsObj(r)##focus()
    },
  reducer: (action, state) =>
    switch (action) {
    | SetFilter(s) => ReasonReact.Update({...state, filter: s})
    },
  render: self =>
    <div>
      (
        switch (mode) {
        | Normal =>
          <div className="edit">
            <a href="#" onClick=(onClick(Editing))>
              (ReasonReact.string("Edit"))
            </a>
          </div>
        | _ => ReasonReact.null
        }
      )
    </div>,
};
