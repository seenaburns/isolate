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
        | Editing
        | Moving =>
          <div className="edit">
            <a href="#" onClick=(e => onClick(Moving, e))>
              (ReasonReact.string("Move"))
            </a>
            <a href="#" onClick=(e => onClick(Normal, e))>
              (ReasonReact.string("Cancel"))
            </a>
          </div>
        }
      )
      (
        if (mode == Moving) {
          let dirs =
            ReasonReact.array(
              {
                let dirs = Path.directoryWalk(root, 5, false, true);
                let queryRe = Js.Re.fromString(self.state.filter);
                let dirs =
                  Array.of_list(
                    List.filter(
                      (p: Path.absolute) =>
                        Js.Option.isSome(Js.Re.exec(p.path, queryRe)),
                      Array.to_list(dirs),
                    ),
                  );

                Array.map(
                  (d: Path.absolute) => {
                    let d = Path.asBase(d.path);
                    let display = Path.renderableFromRoot(d, root);
                    <a
                      href="#"
                      onClick=(
                        e => {
                          move(d);
                          onClick(Normal, e);
                        }
                      )>
                      (ReasonReact.string(display))
                    </a>;
                  },
                  dirs,
                );
              },
            );

          let onchange = (e, self) => {
            e##preventDefault();
            self.ReasonReact.send(SetFilter(e##target##value));
          };

          let input =
            ReasonReact.createDomElement(
              "input",
              ~props={
                "type": "text",
                "class": "search",
                "placeholder": "Search..",
                "onChange": self.handle(onchange),
                "ref": self.handle(setInputRef),
              },
              [||],
            );

          <div className="moving-modal">
            <p> (ReasonReact.string("Move to folder")) </p>
            input
            dirs
            <a href="#" onClick=(_ => self.send(SetMoving(false)))>
              (ReasonReact.string("Cancel"))
            </a>
          </div>;
        } else {
          ReasonReact.null;
        }
      )
    </div>,
};
