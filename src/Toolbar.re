[@bs.val] external document : 'jsModule = "document";

type state = {directoriesEnabled: bool};

type action =
  | SetDirectoriesEnabled(bool)
  | Keydown(ReactEventRe.Keyboard.t);

let component = ReasonReact.reducerComponent("Toolbar");
let make =
    (
      ~dirs,
      ~imageCount,
      ~mode: State.mode,
      ~move,
      ~pwd,
      ~root,
      ~searchActive,
      ~setImages,
      ~setMode: State.mode => unit,
      ~setPwd,
      ~setSearchActive,
      ~zoom: bool => unit,
      _children,
    ) => {
  ...component,
  initialState: () => {directoriesEnabled: true},
  didMount: self =>
    document##addEventListener("keydown", e => self.send(Keydown(e))),
  reducer: (action, state) =>
    switch (action) {
    | SetDirectoriesEnabled(b) => ReasonReact.Update({directoriesEnabled: b})
    | Keydown(e) =>
      let active = document##activeElement;
      let notInput = active##tagName != "INPUT";
      let isInputFilter = active##className == "filter";
      let noModifiers =
        ! (
          ReactEventRe.Keyboard.altKey(e)
          || ReactEventRe.Keyboard.ctrlKey(e)
          || ReactEventRe.Keyboard.metaKey(e)
          || ReactEventRe.Keyboard.shiftKey(e)
        );
      switch (ReactEventRe.Keyboard.key(e)) {
      | "n" when notInput && noModifiers =>
        ReactEventRe.Keyboard.preventDefault(e);
        ReasonReact.Update({directoriesEnabled: true});
      | "Escape" when (notInput || isInputFilter) && state.directoriesEnabled =>
        ReasonReact.Update({directoriesEnabled: false})
      | _ => ReasonReact.NoUpdate
      };
    },
  render: self => {
    let search = (query: string) => {
      setSearchActive(true);
      setImages(Search.search(root, query));
    };

    let cancel = () => {
      setMode(Normal);
      setSearchActive(false);
      setImages(Path.images(pwd));
    };

    let menuItems: Js.Array.t(PopupMenu.item) = [|
      {text: "Move", action: () => setMode(Edit)},
      {text: "Nightmode", action: () => Util.toggleNightMode()},
    |];

    /* Skip unnecessary events if directories is forced open (mode!=Normal) */
    let onMouse = (enabled: bool) =>
      switch (mode) {
      | Normal when self.state.directoriesEnabled != enabled =>
        self.ReasonReact.send(SetDirectoriesEnabled(enabled))
      | _ => ()
      };
    let onMouseLeave = _e => onMouse(false);
    let onMouseEnter = _e => onMouse(true);

    /* Construct PWD */
    let renderedPwd = {
      let pwdPath = Path.renderable(pwd, pwd, root);
      {j|$(pwdPath) ($(imageCount))|j};
    };

    let directories =
      if (! searchActive) {
        /* Show directories on hover in normal mode
         * When moving, use to select destination
         * Disable otherwise (still render so it animates out)
         */
        switch (mode) {
        | Normal =>
          let items =
            Js.Array.map(
              (p: Path.base) => (
                {
                  display: Path.renderable(p, pwd, root),
                  action: _ => setPwd(p),
                }: Directories.item
              ),
              Array.of_list(dirs),
            );
          <Directories
            title="Navigate:"
            items
            enabled=self.state.directoriesEnabled
            setEnabled=(b => self.send(SetDirectoriesEnabled(b)))
          />;
        | EditMoving =>
          let allDirs = Path.directoryWalk(root, 5, false, true);
          let items =
            Js.Array.map(
              (p: Path.absolute) => (
                {
                  let asBase = Path.asBase(p.path);
                  {
                    display: Path.renderable(asBase, Path.asBase("/"), root),
                    action: _ => {
                      Js.log("Move to " ++ p.path);
                      self.send(SetDirectoriesEnabled(false));
                      move(asBase);
                      setMode(Normal);
                    },
                  };
                }: Directories.item
              ),
              allDirs,
            );

          <Directories title="Select destination:" items enabled=true />;
        | _ => <Directories title="" items=[||] enabled=false />
        };
      } else {
        ReasonReact.null;
      };

    <header className="main-header" onMouseLeave>
      directories
      /* Define separate zones for separate on-hover behavior */
      <div className="toolbar">
        <div className="left" onMouseEnter>
          (
            if (! searchActive) {
              <h3> (ReasonReact.string(renderedPwd)) </h3>;
            } else {
              ReasonReact.null;
            }
          )
        </div>
        <div className="center">
          <a href="#" onClick=(_ => zoom(false))>
            (ReasonReact.string("-"))
          </a>
          (ReasonReact.string("Zoom"))
          <a href="#" onClick=(_ => zoom(true))>
            (ReasonReact.string("+"))
          </a>
        </div>
        <div className="right">
          (
            switch (mode) {
            | Normal => <PopupMenu title="More" menuItems />
            | Edit
            | EditMoving =>
              <div className="edit">
                <a href="#" onClick=(e => setMode(EditMoving))>
                  (ReasonReact.string("Move"))
                </a>
                <a href="#" onClick=(e => setMode(Normal))>
                  (ReasonReact.string("Cancel"))
                </a>
              </div>
            | Search =>
              <a href="#" onClick=(_ => cancel())>
                (ReasonReact.string("Back"))
              </a>
            }
          )
          <Search active=searchActive search setMode />
        </div>
      </div>
    </header>;
  },
};
