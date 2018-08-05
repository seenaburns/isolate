let component = ReasonReact.statelessComponent("Toolbar");
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
  render: self => {
    let search = (query: string) => {
      setSearchActive(true);
      setImages(Search.search(root, query));
    };

    let cancel = () => {
      setSearchActive(false);
      setImages(Path.images(pwd));
    };

    let renderPath = (p: Path.base) : string => {
      Path.renderable(p, pwd, root)
    };

    <header className="main-header">
      (
        if (! searchActive) {
          <Directories title="Navigate:" items=(Array.of_list(dirs)) setPwd renderPath/>;
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
