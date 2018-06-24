let component = ReasonReact.statelessComponent("Image");
let make =
    (
      ~image: Path.absolute,
      ~imageOnClick: (Path.absolute, ReactEventRe.Mouse.t) => unit,
      ~selected: bool,
      _children,
    ) => {
  ...component,
  render: _self => {
    let url = Path.makeUrl(image).url;
    let className = "iw" ++ (selected ? " selected" : "");
    <div className> <img src=url onClick=(imageOnClick(image)) /> </div>;
  },
};
