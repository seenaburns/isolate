type mode =
  | Normal
  | Editing;

type state = {
  moving: bool,
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
  initialState: () => {moving: false, filter: "", inputRef: ref(None)},
  didUpdate: ({oldSelf, newSelf}) =>
    switch (newSelf.state.inputRef^) {
    | None => ()
    | Some(r) => ReasonReact.refToJsObj(r)##focus()
    },
  reducer: (action, state) =>
    switch (action) {
    | SetMoving(b) => ReasonReact.Update({...state, moving: b, filter: ""})
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
        | Editing =>
          <div className="edit">
            <a href="#" onClick=(_ => self.send(SetMoving(true)))>
              (ReasonReact.string("Move"))
            </a>
            <a
              href="#"
              onClick=(
                e => {
                  self.send(SetMoving(false));
                  onClick(Normal, e);
                }
              )>
              (ReasonReact.string("Esc"))
            </a>
          </div>
        }
      )
      (
        if (self.state.moving) {
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
                        _ => {
                          self.send(SetMoving(false));
                          move(d);
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
