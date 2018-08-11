module Modal = {
  type state = {
    active: bool,
    zoomed: bool,
    current: Path.absolute,
  };

  type action =
    | Advance(bool) /* true if advance forward */
    | Set(Path.absolute);
    | SetActive(bool)
    | SetZoom(bool)
    | ZoomToggle
};

type state = {
  images: array(Path.absolute),
  modal: Modal.state,
  mode: Edit.mode,
  ncols: int,
  pwd: Path.base,
  root: Path.base,
  search: bool,
  selected: Js.Array.t(Path.absolute),

  /* Flag to track if ImageGrid should show all images or a subset */
  showFull: bool,
};

module Selection = {
  type action =
    | Add(Path.absolute)
    | Clear;
    | Remove(Path.absolute)
    | Toggle(Path.absolute)
};

type action =
  | ImageClick(Path.absolute)
  | ModalAction(Modal.action)
  | Move(Path.base)
  | Resize(int)
  | Selection(Selection.action);
  | SetImages(array(Path.absolute))
  | SetMode(Edit.mode)
  | SetPwd(Path.base)
  | SetRoot(Path.base)
  | SetSearchActive(bool)
  | SetShowFull(bool)

let init = () => {
  images: [||],
  modal: Modal.{active: false, zoomed: false, current: Path.asAbsolute("")},
  mode: Edit.Normal,
  ncols: 4,
  pwd: Path.asBase(""),
  root: Path.asBase(""),
  search: false,
  selected: [||],
  showFull: false,
};
