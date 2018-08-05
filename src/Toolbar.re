type state = {directoryFilter: string};

type action =
  | SetFilter(string);

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
  initialState: () => {directoryFilter: ""},
  reducer: (action, _) =>
    switch (action) {
    | SetFilter(s) => ReasonReact.Update({directoryFilter: s})
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
    
    let onMouseLeave = (_e) => {
      Js.log("left");
      self.ReasonReact.send(SetFilter(""));
    };

    <header className="main-header" onMouseLeave>
      (
        if (! searchActive) {
          <Directories
            title="Navigate:"
            items=(Array.of_list(dirs))
            setPwd
            filter=self.state.directoryFilter
            setFilter=(s => self.ReasonReact.send(s))
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
