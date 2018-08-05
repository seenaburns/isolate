type state = {directoriesEnabled: bool};

type action =
  | SetDirectoriesEnabled(bool);

let component = ReasonReact.reducerComponent("Toolbar");
let make =
    (
      ~dirs,
      ~mode,
      ~pwd,
      ~root,
      ~move,
      ~searchActive,
      ~setImages,
      ~setMode,
      ~setPwd,
      ~setSearchActive,
      _children,
    ) => {
  ...component,
  initialState: () => {directoriesEnabled: false},
  reducer: (action, _) =>
    switch (action) {
    | SetDirectoriesEnabled(b) => ReasonReact.Update({directoriesEnabled: b})
    },
  render: self => {
    let search = (query: string) => {
      setSearchActive(true);
      setImages(Search.search(root, query));
    };

    let cancel = () => {
      setSearchActive(false);
      setImages(Path.images(pwd));
    };

    let renderPath = (p: Path.base) : string =>
      Path.renderable(p, pwd, root);

    let onMouseLeave = _e => {
      let _ =
        Js.Global.setTimeout(
          _ => self.ReasonReact.send(SetDirectoriesEnabled(false)),
          200,
        );
      ();
    };

    let onMouseEnter = _e => {
      self.ReasonReact.send(SetDirectoriesEnabled(true));
    };

    <header className="main-header" onMouseLeave onMouseEnter>
      (
        if (! searchActive) {
          <Directories
            title="Navigate:"
            items=(Array.of_list(dirs))
            setPwd
            enabled=self.state.directoriesEnabled
            renderPath
          />;
        } else {
          ReasonReact.null;
        }
      )
      <div className="toolbar">
        (
          if (! searchActive) {
            <h3> (ReasonReact.string(pwd.path)) </h3>;
          } else {
            ReasonReact.null;
          }
        )
        <Search active=searchActive search cancel />
        <Edit mode pwd root move onClick=((m, _) => setMode(m)) />
      </div>
    </header>;
  },
};
