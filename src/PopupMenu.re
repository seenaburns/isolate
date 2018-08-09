type item = {
  text: string,
  action: unit => unit,
};

type state = {enabled: bool};

type acion =
  | SetEnabled(bool);

let component = ReasonReact.reducerComponent("PopupMenu");
let make = (~title, ~menuItems: Js.Array.t(item), _children) => {
  ...component,
  initialState: () => {enabled: false},
  reducer: (action, _state) =>
    switch (action) {
    | SetEnabled(b) => ReasonReact.Update({enabled: b})
    },
  render: self => {
    let className =
      if (self.state.enabled) {
        "popup-container enabled";
      } else {
        "popup-container disabled";
      };

    let renderItem = (i: item) =>
      <div className="menu-item" onClick=(_ => i.action())>
        (ReasonReact.string(i.text))
      </div>;

    let renderedMenuItems =
      ReasonReact.createDomElement(
        "div",
        ~props={"className": "menu-items"},
        Js.Array.map(renderItem, menuItems),
      );

    <div
      className="more"
      onMouseEnter=(_ => self.send(SetEnabled(true)))
      onMouseLeave=(_ => self.send(SetEnabled(false)))>
      <div> (ReasonReact.string(title)) </div>
      <div className> <div className="popup"> renderedMenuItems </div> </div>
    </div>;
  },
};
