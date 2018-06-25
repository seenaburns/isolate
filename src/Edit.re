type mode =
  | Normal
  | Editting;

type state = {moving: bool};

type action =
  | SetMoving(bool);

let component = ReasonReact.reducerComponent("Edit");
let make = (~mode, ~pwd, ~root, ~onClick, ~move, _children) => {
  ...component,
  initialState: () => {moving: false},
  reducer: (action, _) =>
    switch (action) {
    | SetMoving(b) => ReasonReact.Update({moving: b})
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
          let dirs = {
            let dirs = Path.directoryWalk(root, 5, false, true);
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
          };

          let children = [
            [|<p> (ReasonReact.string("Move to folder")) </p>|],
            dirs,
            [|
              <a href="#" onClick=(_ => self.send(SetMoving(false)))>
                (ReasonReact.string("Cancel"))
              </a>,
            |],
          ];

          ReasonReact.createDomElement(
            "div",
            ~props={"className": "moving-modal"},
            Array.concat(children),
          );
        } else {
          ReasonReact.null;
        }
      )
    </div>,
};
