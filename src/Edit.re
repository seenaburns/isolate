type mode =
  | Normal
  | Editting;

type state = {
  moving: bool,
  filter: string,
};

type action =
  | SetMoving(bool)
  | SetFilter(string);

let component = ReasonReact.reducerComponent("Edit");
let make = (~mode, ~pwd, ~root, ~onClick, ~move, _children) => {
  ...component,
  initialState: () => {moving: false, filter: ""},
  reducer: (action, state) =>
    switch (action) {
    | SetMoving(b) => ReasonReact.Update({moving: b, filter: ""})
    | SetFilter(s) => ReasonReact.Update({...state, filter: s})
    },
  render: self =>
    <div>
      (
        switch (mode) {
        | Normal =>
          <div className="edit">
            <a href="#" onClick=(onClick(Editting))>
              (ReasonReact.string("Edit"))
            </a>
          </div>
        | Editting =>
          <div className="edit">
            <a href="#" onClick=(_ => self.send(SetMoving(true)))>
              (ReasonReact.string("Move"))
            </a>
            <a href="#" onClick=(onClick(Normal))>
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
