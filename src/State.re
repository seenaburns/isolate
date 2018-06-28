module Modal = {
  type state = {
    active: bool,
    zoomed: bool,
    current: Path.absolute,
  };

  type action =
    | SetActive(bool)
    | SetZoom(bool)
    | ZoomToggle
    | Advance(bool) /* true if advance forward */
    | Set(Path.absolute);
};

type state = {
  root: Path.base,
  pwd: Path.base,
  search: bool,
  images: array(Path.absolute),
  modal: Modal.state,
  /* Flag to track if ImageGrid should show all images or a subset */
  showFull: bool,
  ncols: int,
  mode: Edit.mode,
  selected: Js.Array.t(Path.absolute),
};

module Selection = {
  type action =
    | Add(Path.absolute)
    | Remove(Path.absolute)
    | Toggle(Path.absolute)
    | Clear;
};

type action =
  | SetRoot(Path.base)
  | SetPwd(Path.base)
  | SetImages(array(Path.absolute))
  | SetSearchActive(bool)
  | SetShowFull(bool)
  | Resize(int)
  | SetMode(Edit.mode)
  | ImageClick(Path.absolute)
  | Move(Path.base)
  | ModalAction(Modal.action)
  | Selection(Selection.action);

let init = () => {
  root: Path.asBase(""),
  pwd: Path.asBase(""),
  search: false,
  images: [||],
  modal: Modal.{active: false, zoomed: false, current: Path.asAbsolute("")},
  showFull: false,
  ncols: 4,
  mode: Edit.Normal,
  selected: [||],
};
