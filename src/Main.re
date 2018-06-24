[@bs.val] external document : 'jsModule = "document";
let electron: 'jsModule = [%bs.raw {| require("electron") |}];

module Main = {
  type mode =
    | Normal
    | Editting;

  type state = {
    root: Path.base,
    pwd: Path.base,
    search: bool,
    images: array(Path.absolute),
    modal: Modal.state,
    /* Flag to track if ImageGrid should show all images or a subset */
    showFull: bool,
    ncols: int,
    mode,
    selected: Js.Array.t(Path.absolute),
  };

  type selection =
    | Add(Path.absolute)
    | Remove(Path.absolute)
    | Toggle(Path.absolute)
    | Clear;

  type action =
    | SetRoot(Path.base)
    | SetPwd(Path.base)
    | SetImages(array(Path.absolute))
    | SetSearchActive(bool)
    | ModalAction(Modal.action)
    | SetShowFull(bool)
    | Resize(int)
    | SetMode(mode)
    | Selection(selection)
    | ImageClick(Path.absolute);

  let initState = () => {
    root: Path.asBase(""),
    pwd: Path.asBase(""),
    search: false,
    images: [||],
    modal:
      Modal.{active: false, zoomed: false, current: Path.asAbsolute("")},
    showFull: false,
    ncols: 4,
    mode: Normal,
    selected: [||],
  };

  let readOnlyState: ref(option(state)) = ref(None);

  let component = ReasonReact.reducerComponent("Main");
  let make = (setSendAction, _children) => {
    let keydown = (self: ReasonReact.self('a, 'b, 'c), e) =>
      switch (e##key) {
      | "Escape" => self.send(ModalAction(Modal.SetActive(false)))
      | "z" => self.send(ModalAction(Modal.ZoomToggle))
      | "ArrowRight" => self.send(ModalAction(Modal.Advance(true)))
      | "ArrowLeft" => self.send(ModalAction(Modal.Advance(false)))
      | _ => ()
      };

    {
      ...component,
      initialState: initState,
      /* Temporary while migrating to ReasonReact,
       * allows internal state to be visible (via Modal.readOnlyState) and set externally (via
       * setSendAction)
       */
      didMount: self => {
        document##addEventListener("keydown", keydown(self));
        setSendAction(self.send);
      },
      didUpdate: s => readOnlyState := Some(s.newSelf.state),
      reducer: (action: action, state) => {
        let setFullTimeout = self => {
          let _ =
            Js.Global.setTimeout(
              () => self.ReasonReact.send(SetShowFull(true)),
              300,
            );
          ();
        };

        let selectionReducer = (action: selection) => {
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

        switch (action) {
        | SetRoot(path) => ReasonReact.Update({...state, root: path})
        | SetPwd(path) =>
          ReasonReact.UpdateWithSideEffects(
            {...state, pwd: path, showFull: false},
            (
              self => {
                setFullTimeout(self);
                /*
                 * Chromium seems to hold a copy of every image in the webframe cache. This can
                 * cause the memory used to balloon, looking alarming to users.
                 * webFrame.clearCache() unloads these images, dropping memory at the cost of
                 * directory load time.
                 */
                electron##webFrame##clearCache();
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
        | ModalAction(m) =>
          switch (Modal.reducer(m, state.modal, state.images)) {
          | (Some(s), Some(se)) =>
            ReasonReact.UpdateWithSideEffects(
              {...state, modal: s},
              (_ => se()),
            )
          | (Some(s), None) => ReasonReact.Update({...state, modal: s})
          | _ => ReasonReact.NoUpdate
          }
        | SetShowFull(b) =>
          if (b) {
            ReasonReact.Update({...state, showFull: b});
          } else {
            ReasonReact.UpdateWithSideEffects(
              {...state, showFull: b},
              (self => setFullTimeout(self)),
            );
          }
        | Resize(cols) => ReasonReact.Update({...state, ncols: cols})
        | SetMode(m) =>
          switch (m) {
          | Normal => ReasonReact.Update({...state, mode: m, selected: [||]})
          | Editting => ReasonReact.Update({...state, mode: m})
          }
        | Selection(a) => selectionReducer(a)
        | ImageClick(path) =>
          /* Move imageOnClick logic into reducer so it doesn't have to re-render on every mode
           * change.
           *
           * This is super cumbersome without a way to send new actions in the reducer or a better
           * way of composing.
           *
           * TODO: make this reuse logic
           */
          switch (state.mode) {
          | Normal =>
            let (s1, se1) =
              Modal.reducer(
                Modal.SetActive(true),
                state.modal,
                state.images,
              );
            let (s2, se2) =
              Modal.reducer(
                Modal.Set(path),
                switch (s1) {
                | None => state.modal
                | Some(x) => x
                },
                state.images,
              );
            ReasonReact.UpdateWithSideEffects(
              switch (s2) {
              | None => state
              | Some(x) => {...state, modal: x}
              },
              (
                _ => {
                  switch (se1) {
                  | Some(f) => f()
                  | None => ()
                  };
                  switch (se2) {
                  | Some(f) => f()
                  | None => ()
                  };
                }
              ),
            );
          | Editting => selectionReducer(Toggle(path))
          }
        };
      },
      render: self => {
        let setPwd = (path: Path.base, _event) => {
          self.send(SetPwd(path));
          self.send(SetImages(Path.images(path)));
        };

        let imageOnClick = (path: Path.absolute, _: ReactEventRe.Mouse.t) =>
          self.send(ImageClick(path));

        if (self.state.root.path == "") {
          /* Show drag and drop */
          <div className="dragndrop">
            <img src="assets/icon_512x512.png" />
            <p>
              (ReasonReact.string("Drag & drop a folder to get started"))
            </p>
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

          /* Construct PWD */
          let pwdPath =
            Path.renderable(self.state.pwd, self.state.pwd, self.state.root);
          let imageCount = Array.length(self.state.images);
          let pwd = {j|$(pwdPath) ($(imageCount))|j};

          let header = {
            let edit =
              switch (self.state.mode) {
              | Normal =>
                <div className="edit">
                  <a href="#" onClick=(_ => self.send(SetMode(Editting)))>
                    (ReasonReact.string("Edit"))
                  </a>
                </div>
              | Editting =>
                <div className="edit">
                  <a href="#"> (ReasonReact.string("Move")) </a>
                  <a href="#" onClick=(_ => self.send(SetMode(Normal)))>
                    (ReasonReact.string("Esc"))
                  </a>
                </div>
              };

            <header className="main-header">
              <Search
                active=self.state.search
                root=self.state.root
                pwd=self.state.pwd
                setSearchActive=(
                  enabled => self.send(SetSearchActive(enabled))
                )
                setImages=(images => self.send(SetImages(images)))
              />
              edit
              (
                if (! self.state.search) {
                  <div>
                    <h3> (ReasonReact.string(pwd)) </h3>
                    <Directories
                      paths=(Array.of_list(dirs))
                      root=self.state.root
                      pwd=self.state.pwd
                      setPwd
                    />
                  </div>;
                } else {
                  ReasonReact.null;
                }
              )
            </header>;
          };

          <div>
            <Modal
              state=self.state.modal
              sendAction=((a: Modal.action) => self.send(ModalAction(a)))
            />
            header
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
};

let sendMainAction = ref(None);
let setSendMainAction = a => sendMainAction := Some(a);
let setMain = (images: array(string)) : unit =>
  switch (sendMainAction^) {
  | None => Js.log("sendMainAction is None")
  | Some(f) =>
    f(Main.SetImages(Array.map(i => Path.asAbsolute(i), images)))
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
    Main.initState();
  | Some(s) => s
  };

let setModal = (image: string) =>
  sendAction(ModalAction(Modal.Set(Path.asAbsolute(image))));
let isModalOpen = () : bool => getState().modal.active;
let currentImage = () : string => getState().modal.current.path;
let openModal = () => sendAction(ModalAction(Modal.SetActive(true)));
let closeModal = () => sendAction(ModalAction(Modal.SetActive(false)));
let setImageList = (images: array(string)) =>
  sendAction(SetImages(Array.map(x => Path.asAbsolute(x), images)));
let setRoot = (s: string) => {
  let p = Path.asBase(s);
  sendAction(SetPwd(p));
  sendAction(SetRoot(p));
  sendAction(SetImages(Path.images(p)));
};
let crossPlatform = Path.crossPlatform;
let setCols = (n: int) => sendAction(Resize(n));

let resizeTimeout = ref(None);
let resize = () => {
  let w = document##querySelector("#images")##clientWidth;
  sendAction(Resize(w / 200));
};
let resizeThrottler = () =>
  switch (resizeTimeout^) {
  | None =>
    resizeTimeout :=
      Some(
        Js.Global.setTimeout(
          () => {
            resizeTimeout := None;
            resize();
          },
          100,
        ),
      )
  | Some(_) => ()
  };

[@bs.send]
external addEventListener : ('a, string, 'b => 'c, bool) => unit =
  "addEventListener";
let window = [%bs.raw {| window |}];
addEventListener(window, "resize", resizeThrottler, false);
