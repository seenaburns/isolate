module Modal = {
  type state = {
    active: bool,
    zoomed: bool,
    current: Path.absolute,
  };

  type action =
    | Advance(bool) /* true if advance forward */
    | Set(Path.absolute)
    | SetActive(bool)
    | SetZoom(bool)
    | ZoomToggle;
};

type state = {
  images: array(Path.absolute),
  modal: Modal.state,
  mode: Edit.mode,
  pwd: Path.base,
  root: Path.base,
  search: bool,
  selected: Js.Array.t(Path.absolute),
  /*
   * ncols: the number of columns rendered by the image grid however, zooming is
   * managed by a desired, minimum column width, which is used to calculate the
   * number of columns that can fit in a window
   */
  ncols: int,
  desiredColumnWidth: int,
  /* Flag to track if ImageGrid should show all images or a subset */
  showFull: bool,
};

module Selection = {
  type action =
    | Add(Path.absolute)
    | Clear
    | Remove(Path.absolute)
    | Toggle(Path.absolute);
};

type action =
  | ImageClick(Path.absolute)
  | ModalAction(Modal.action)
  | Move(Path.base)
  /* Resize with same ncols given #images.ClientWidth */
  | Resize(int)
  /* Resize, computing new column width and ncols, given #images.ClientWidth */
  | ResizeZoom(int, bool)
  | Selection(Selection.action)
  | SetImages(array(Path.absolute))
  | SetMode(Edit.mode)
  | SetPwd(Path.base)
  | SetRoot(Path.base)
  | SetSearchActive(bool)
  | SetShowFull(bool);

let init = () => {
  images: [||],
  modal: Modal.{active: false, zoomed: false, current: Path.asAbsolute("")},
  mode: Edit.Normal,
  pwd: Path.asBase(""),
  root: Path.asBase(""),
  search: false,
  selected: [||],
  desiredColumnWidth: 200,
  ncols: 4,
  showFull: false,
};
