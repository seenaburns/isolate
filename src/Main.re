[@bs.val] external document : 'jsModule = "document";
let electron: 'jsModule = [%bs.raw {| require("electron") |}];
let menu: 'jsModule = [%bs.raw {| require("./menu") |}];

[@bs.send]
external addEventListener : ('a, string, 'b => 'c, bool) => unit =
  "addEventListener";
let window = [%bs.raw {| window |}];

/* Set modal-content to focused element so arrow keys immediately scroll the image, not the
 * background
 */
let setFocus = () => {
  %bs.raw
  {| document.getElementById("modal-content").tabIndex = 0 |};
  %bs.raw
  {| document.getElementById("modal-content").focus() |};
};

let setBodyOverflow = (hidden: bool) : unit =>
  switch (hidden) {
  | false =>
    %bs.raw
    {| document.querySelector("body").style.overflow = "visible" |}
  | true =>
    %bs.raw
    {| document.querySelector("body").style.overflow = "hidden" |}
  };

let rec findIndex = (a: list('a), x: 'a, index: int) : int =>
  switch (a) {
  | [] => (-1)
  | [h, ...t] =>
    if (h == x) {
      index;
    } else {
      findIndex(t, x, index + 1);
    }
  };

let advance = (current: 'a, images: array('a), forward: bool) : option('a) => {
  let currentIndex = findIndex(Array.to_list(images), current, 0);
  if (forward && currentIndex < Array.length(images) - 1) {
    Some(images[currentIndex + 1]);
  } else if (! forward && currentIndex > 0) {
    Some(images[currentIndex - 1]);
  } else {
    None;
  };
};

let selectionReducer = (state: State.state, action: State.Selection.action) => {
  let add = p =>
    if (! Js.Array.includes(p, state.selected)) {
      let newSelected = Js.Array.copy(state.selected);
      let _ = Js.Array.push(p, newSelected);
      ReasonReact.Update({...state, selected: newSelected});
    } else {
      ReasonReact.NoUpdate;
    };

  let remove = p =>
    ReasonReact.Update({
      ...state,
      selected: Js.Array.filter(x => p != x, state.selected),
    });

  switch (action) {
  | Add(p) => add(p)
  | Remove(p) => remove(p)
  | Toggle(p) =>
    if (Js.Array.includes(p, state.selected)) {
      remove(p);
    } else {
      add(p);
    }
  | Clear => ReasonReact.Update({...state, selected: [||]})
  };
};

let modalReducer = (state: State.state, action: State.Modal.action) => {
  let setZoom = (zoomed: bool) => {
    let newState = {
      ...state,
      modal: {
        ...state.modal,
        zoomed,
      },
    };
    if (zoomed) {
      ReasonReact.UpdateWithSideEffects(newState, _ => setFocus());
    } else {
      ReasonReact.Update(newState);
    };
  };

  switch (action) {
  | SetActive(active) =>
    ReasonReact.UpdateWithSideEffects(
      {
        ...state,
        modal: {
          ...state.modal,
          active,
        },
      },
      (
        _ => {
          setBodyOverflow(active);
          menu##setModalOpen(active);
        }
      ),
    )
  | SetZoom(zoomed) => setZoom(zoomed)
  | ZoomToggle => setZoom(! state.modal.zoomed)
  | Advance(forward) when ! state.modal.zoomed =>
    let next = advance(state.modal.current, state.images, forward);
    switch (next) {
    | None => ReasonReact.NoUpdate
    | Some(i) =>
      ReasonReact.Update({
        ...state,
        modal: {
          ...state.modal,
          current: i,
        },
      })
    };
  | Set(image) =>
    ReasonReact.Update({
      ...state,
      modal: {
        ...state.modal,
        current: image,
      },
    })
  | _ => ReasonReact.NoUpdate
  };
};

/*
 * Chromium seems to hold a copy of every image in the webframe cache. This can
 * cause the memory used to balloon, looking alarming to users.
 * webFrame.clearCache() unloads these images, dropping memory at the cost of
 * directory load time.
 */
let clearCache = () => electron##webFrame##clearCache();

/* TODO: current self is set at the start of loading, it should be set on every state change so
 * hotkeys have extra conditions (or the reducer should handle):
 * - Separate `Escape` for if modal is active, if Edit.Editing/Edit.Moving
 * - `e` only applies when Edit.Normal
 * - `m` only applies when Edit.Editing
 */
let keydown = (self: ReasonReact.self(State.state, 'b, 'c), e) => {
  let active = document##activeElement;
  if (active##tagName != "INPUT") {
    switch (e##key) {
    | "Escape" =>
      self.send(State.ModalAction(State.Modal.SetActive(false)));
      self.send(State.SetMode(Edit.Normal));
    | "z" =>
      e##preventDefault();
      self.send(State.ModalAction(State.Modal.ZoomToggle));
    | "ArrowRight" =>
      self.send(State.ModalAction(State.Modal.Advance(true)))
    | "ArrowLeft" =>
      self.send(State.ModalAction(State.Modal.Advance(false)))
    | "e" =>
      e##preventDefault();
      self.send(State.SetMode(Edit.Editing));
    | "m" =>
      e##preventDefault();
      self.send(State.SetMode(Edit.Moving));
    | _ => ()
    };
  };
};

module Main = {
  type state = State.state;
  type action = State.action;

  let readOnlyState: ref(option(state)) = ref(None);

  let component = ReasonReact.reducerComponent("Main");
  let make = (setSendAction, _children) => {
    ...component,
    initialState: State.init,
    /* Temporary while migrating to ReasonReact,
     * allows internal state to be visible (via Modal.readOnlyState) and set externally (via
     * setSendAction)
     */
    didMount: self => {
      addEventListener(document, "keydown", keydown(self), false);
      setSendAction(self.send);
    },
    didUpdate: s => readOnlyState := Some(s.newSelf.state),
    reducer: (action: action, state) => {
      let setFullTimeout = self => {
        let _ =
          Js.Global.setTimeout(
            () => self.ReasonReact.send(State.SetShowFull(true)),
            300,
          );
        ();
      };

      switch (action) {
      | SetRoot(path) => ReasonReact.Update({...state, root: path})
      | SetPwd(path) =>
        ReasonReact.UpdateWithSideEffects(
          {...state, pwd: path, showFull: false},
          (
            self => {
              setFullTimeout(self);
              clearCache();
            }
          ),
        )
      | SetImages(images) =>
        Array.sort(
          (a: Path.absolute, b: Path.absolute) => compare(a.path, b.path),
          images,
        );
        ReasonReact.Update({...state, images, selected: [||]});
      | SetSearchActive(enabled) =>
        ReasonReact.Update({...state, search: enabled})
      | ModalAction(m) => modalReducer(state, m)
      | SetShowFull(b) =>
        if (b) {
          ReasonReact.Update({...state, showFull: b});
        } else {
          ReasonReact.UpdateWithSideEffects(
            {...state, showFull: b},
            (self => setFullTimeout(self)),
          );
        }
      | Resize(imagesClientWidth) =>
        ReasonReact.Update({
          ...state,
          ncols: Resize.columnsThatFit(imagesClientWidth, state.desiredColumnWidth),
        })
      | ResizeZoom(imagesClientWidth, larger) =>
        let (newNCols, newDesiredWidth) =
          Resize.calcNewDesiredColumnWidth(imagesClientWidth, state.ncols, larger);
        ReasonReact.Update({
          ...state,
          ncols: newNCols,
          desiredColumnWidth: newDesiredWidth,
        });
      | SetMode(m) =>
        switch (m) {
        | Edit.Normal =>
          ReasonReact.Update({...state, mode: m, selected: [||]})
        | _ => ReasonReact.Update({...state, mode: m})
        }
      | Selection(a) => selectionReducer(state, a)
      | ImageClick(path) =>
        /* Move imageOnClick logic into reducer so it doesn't have to re-render on every mode
         * change.
         */
        switch (state.mode) {
        | Edit.Normal =>
          ReasonReact.SideEffects(
            (
              self => {
                self.send(ModalAction(State.Modal.SetActive(true)));
                self.send(ModalAction(State.Modal.Set(path)));
              }
            ),
          )
        | Edit.Editing
        | Edit.Moving => selectionReducer(state, Toggle(path))
        }
      | Move(dest) =>
        ReasonReact.UpdateWithSideEffects(
          {...state, selected: [||], mode: Edit.Normal},
          (
            self => {
              Js.Array.forEach(
                (p: Path.absolute) => Path.unsafeMove(p, dest),
                state.selected,
              );
              self.send(SetImages(Path.images(state.pwd)));
            }
          ),
        )
      };
    },
    render: self => {
      let setPwd = (path: Path.base) => {
        self.send(SetPwd(path));
        self.send(SetImages(Path.images(path)));
      };

      let imageOnClick = (path: Path.absolute, _: ReactEventRe.Mouse.t) =>
        self.send(ImageClick(path));

      let move = (dest: Path.base) => self.send(Move(dest));

      if (self.state.root.path == "") {
        /* Show drag and drop */
        <div className="dragndrop">
          <img src="assets/icon_512x512.png" />
          <p> (ReasonReact.string("Drag & drop a folder to get started")) </p>
        </div>;
      } else {
        let dirs = {
          let subdirs = Array.to_list(Path.subdirs(self.state.pwd));
          if (self.state.pwd != self.state.root) {
            [Path.up(self.state.pwd), ...subdirs];
          } else {
            subdirs;
          };
        };

        <div>
          <Modal
            state=self.state.modal
            sendAction=(
              (a: State.Modal.action) => self.send(ModalAction(a))
            )
          />
          <Toolbar
            dirs
            imageCount=(Array.length(self.state.images))
            mode=self.state.mode
            move
            pwd=self.state.pwd
            root=self.state.root
            searchActive=self.state.search
            setImages=(images => self.send(SetImages(images)))
            setMode=(m => self.send(SetMode(m)))
            setPwd
            setSearchActive=(enabled => self.send(SetSearchActive(enabled)))
            zoom=(b => self.send(ResizeZoom(Resize.getImagesClientWidth(), b)))
          />
          <ImageGrid
            images=self.state.images
            showFull=self.state.showFull
            ncols=self.state.ncols
            imageOnClick
            selectedList=self.state.selected
          />
        </div>;
      };
    },
  };
};

let sendMainAction = ref(None);
let setSendMainAction = a => sendMainAction := Some(a);
let setMain = (images: array(string)) : unit =>
  switch (sendMainAction^) {
  | None => Js.log("sendMainAction is None")
  | Some(f) =>
    f(State.SetImages(Array.map(i => Path.asAbsolute(i), images)))
  };
let b = Main.make(setSendMainAction, [||]);
ReactDOMRe.renderToElementWithId(ReasonReact.element(b), "browser-root");

/* Extract send function and send action or log error */
let sendAction = (a: Main.action) : unit =>
  switch (sendMainAction^) {
  | None => Js.log("sendMainAction is None")
  | Some(f) => f(a)
  };

/* Extract current state or log error and return zero values */
let getState = () =>
  switch (Main.readOnlyState^) {
  | None =>
    Js.log("Main.readOnlyState is None");
    State.init();
  | Some(s) => s
  };

let isModalOpen = () : bool => getState().modal.active;
let currentImage = () : string => getState().modal.current.path;
let setRoot = (s: string) => {
  let p = Path.asBase(s);
  sendAction(SetPwd(p));
  sendAction(SetRoot(p));
  sendAction(SetImages(Path.images(p)));
};
let crossPlatform = Path.crossPlatform;
let setCols = (n: int) => sendAction(Resize(n));

let zoomIn = () => {
  sendAction(ResizeZoom(Resize.getImagesClientWidth(), true));
};
let zoomOut = () => {
  sendAction(ResizeZoom(Resize.getImagesClientWidth(), false));
};

/* Register event listener for window resize
 * limits resize to one call per 100ms
 */
let resize_rate_ms = 100;

let resizeThrottler =
  Util.throttle(
    resize_rate_ms,
    () => {
      Js.log("resize");
      sendAction(Resize(Resize.getImagesClientWidth()));
    },
  );

addEventListener(window, "resize", resizeThrottler, false);

/* Export nightmode functions to js */
let setNightMode = Util.setNightMode;
let nightModeEnabled = Util.nightModeEnabled;
let toggleNightMode = Util.toggleNightMode;