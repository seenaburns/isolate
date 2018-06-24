let component = ReasonReact.statelessComponent("Image");
let make = (~image: Path.absolute, ~openModal, _children) => {
  ...component,
  render: _self => {
    let url = Path.makeUrl(image).url;
    <div className="iw">
      <img src={url} onClick={openModal(image)} />
    </div>
  }
}
